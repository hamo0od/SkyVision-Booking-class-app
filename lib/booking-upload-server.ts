import { appendFile, mkdir, readFile, rename, rm, stat, writeFile } from "fs/promises"
import { join } from "path"
import {
  BOOKING_UPLOAD_CHUNK_SIZE_BYTES,
  MAX_PDF_FILE_SIZE_BYTES,
  buildBookingUploadToken,
  parseBookingUploadToken,
} from "@/lib/booking-upload"

type BookingUploadManifest = {
  ownerId: string
  fileName: string
  mimeType: string
  totalChunks: number
  nextChunkIndex: number
  createdAt: number
}

type AppendBookingUploadChunkInput = {
  ownerId: string
  uploadId: string
  fileName: string
  mimeType: string
  totalChunks: number
  chunkIndex: number
  chunk: Buffer
}

type ConsumedBookingUpload = {
  buffer: Buffer
  fileName: string
  cleanup: () => Promise<void>
}

const UPLOAD_ID_REGEX = /^[a-f0-9-]{36}$/i
const MAX_UPLOAD_CHUNKS = Math.ceil(MAX_PDF_FILE_SIZE_BYTES / BOOKING_UPLOAD_CHUNK_SIZE_BYTES)
const uploadLocks = new Map<string, Promise<void>>()

async function withUploadLock<T>(uploadId: string, operation: () => Promise<T>): Promise<T> {
  const previous = uploadLocks.get(uploadId) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  uploadLocks.set(uploadId, current)

  await previous
  try {
    return await operation()
  } finally {
    release()
    if (uploadLocks.get(uploadId) === current) uploadLocks.delete(uploadId)
  }
}

function validateUploadId(uploadId: string) {
  if (!UPLOAD_ID_REGEX.test(uploadId)) {
    throw new Error("Invalid upload id")
  }
}

function getTempUploadDir() {
  return join(process.cwd(), "uploads", "tmp", "bookings")
}

function getManifestPath(uploadId: string) {
  return join(getTempUploadDir(), `${uploadId}.json`)
}

function getPartPath(uploadId: string) {
  return join(getTempUploadDir(), `${uploadId}.part`)
}

function getCompletedPath(uploadId: string) {
  return join(getTempUploadDir(), `${uploadId}.upload`)
}

function sanitizeUploadFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
}

async function readManifest(uploadId: string): Promise<BookingUploadManifest | null> {
  try {
    const raw = await readFile(getManifestPath(uploadId), "utf8")
    return JSON.parse(raw) as BookingUploadManifest
  } catch {
    return null
  }
}

async function writeManifest(uploadId: string, manifest: BookingUploadManifest) {
  await writeFile(getManifestPath(uploadId), JSON.stringify(manifest), "utf8")
}

async function cleanupUploadId(uploadId: string) {
  await Promise.allSettled([
    rm(getManifestPath(uploadId), { force: true }),
    rm(getPartPath(uploadId), { force: true }),
    rm(getCompletedPath(uploadId), { force: true }),
  ])
}

export async function appendBookingUploadChunk({
  ownerId,
  uploadId,
  fileName,
  mimeType,
  totalChunks,
  chunkIndex,
  chunk,
}: AppendBookingUploadChunkInput): Promise<{ completed: boolean; uploadToken?: string }> {
  if (!ownerId || !uploadId) {
    throw new Error("Upload id is required")
  }

  validateUploadId(uploadId)

  if (mimeType !== "application/pdf" || !fileName.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF uploads are supported")
  }

  if (!Number.isInteger(totalChunks) || totalChunks < 1 || totalChunks > MAX_UPLOAD_CHUNKS) {
    throw new Error("Invalid total chunk count")
  }

  if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= totalChunks) {
    throw new Error("Invalid chunk index")
  }

  if (chunk.length < 1 || chunk.length > BOOKING_UPLOAD_CHUNK_SIZE_BYTES) {
    throw new Error("Invalid upload chunk size")
  }

  if (chunkIndex === 0 && chunk.subarray(0, 5).toString("utf8") !== "%PDF-") {
    throw new Error("Uploaded file must be a valid PDF")
  }

  await mkdir(getTempUploadDir(), { recursive: true })

  return withUploadLock(uploadId, async () => {
    let currentManifest = await readManifest(uploadId)

    if (!currentManifest) {
      if (chunkIndex !== 0) throw new Error("Upload must start from the first chunk")
      currentManifest = {
        ownerId,
        fileName: sanitizeUploadFileName(fileName),
        mimeType,
        totalChunks,
        nextChunkIndex: 0,
        createdAt: Date.now(),
      }
      await writeManifest(uploadId, currentManifest)
    }

    if (currentManifest.ownerId !== ownerId) throw new Error("Upload does not belong to this user")
    if (currentManifest.totalChunks !== totalChunks) throw new Error("Chunk count mismatch")
    if (currentManifest.nextChunkIndex !== chunkIndex) throw new Error("Chunks were received out of order")

    let currentSize = 0
    try {
      currentSize = (await stat(getPartPath(uploadId))).size
    } catch {
      // The first chunk has no partial file yet.
    }
    if (currentSize + chunk.length > MAX_PDF_FILE_SIZE_BYTES) {
      await cleanupUploadId(uploadId)
      throw new Error("Uploaded file exceeds the maximum allowed size")
    }

    await appendFile(getPartPath(uploadId), chunk)
    const nextChunkIndex = chunkIndex + 1
    await writeManifest(uploadId, { ...currentManifest, nextChunkIndex })

    if (nextChunkIndex === totalChunks) {
      await rename(getPartPath(uploadId), getCompletedPath(uploadId))
      return { completed: true, uploadToken: buildBookingUploadToken(uploadId) }
    }

    return { completed: false }
  })
}

export async function consumeBookingUpload(uploadToken: string, ownerId: string): Promise<ConsumedBookingUpload> {
  const uploadId = parseBookingUploadToken(uploadToken)
  if (!ownerId || !uploadId) {
    throw new Error("Invalid upload token")
  }
  validateUploadId(uploadId)

  const manifest = await readManifest(uploadId)
  if (!manifest) {
    throw new Error("Upload metadata was not found")
  }

  if (!ownerId || manifest.ownerId !== ownerId) {
    throw new Error("Upload does not belong to this user")
  }

  if (manifest.nextChunkIndex !== manifest.totalChunks) {
    throw new Error("Upload is incomplete")
  }

  const completedPath = getCompletedPath(uploadId)
  const uploadStats = await stat(completedPath)
  if (uploadStats.size > MAX_PDF_FILE_SIZE_BYTES) {
    await cleanupUploadId(uploadId)
    throw new Error("Uploaded file exceeds the maximum allowed size")
  }

  const buffer = await readFile(completedPath)

  return {
    buffer,
    fileName: manifest.fileName,
    cleanup: async () => {
      await cleanupUploadId(uploadId)
    },
  }
}

export async function cleanupBookingUpload(uploadToken: string | null | undefined) {
  const uploadId = parseBookingUploadToken(uploadToken)
  if (!uploadId) {
    return
  }
  validateUploadId(uploadId)

  await cleanupUploadId(uploadId)
}
