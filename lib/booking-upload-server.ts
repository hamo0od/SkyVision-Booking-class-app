import { appendFile, mkdir, readFile, rename, rm, stat, writeFile } from "fs/promises"
import { join } from "path"
import {
  MAX_PDF_FILE_SIZE_BYTES,
  buildBookingUploadToken,
  parseBookingUploadToken,
} from "@/lib/booking-upload"

type BookingUploadManifest = {
  fileName: string
  mimeType: string
  totalChunks: number
  nextChunkIndex: number
}

type AppendBookingUploadChunkInput = {
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
  uploadId,
  fileName,
  mimeType,
  totalChunks,
  chunkIndex,
  chunk,
}: AppendBookingUploadChunkInput): Promise<{ completed: boolean; uploadToken?: string }> {
  if (!uploadId) {
    throw new Error("Upload id is required")
  }

  if (!fileName.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF uploads are supported")
  }

  if (totalChunks < 1) {
    throw new Error("Invalid total chunk count")
  }

  if (chunkIndex < 0 || chunkIndex >= totalChunks) {
    throw new Error("Invalid chunk index")
  }

  await mkdir(getTempUploadDir(), { recursive: true })

  const manifest = await readManifest(uploadId)

  if (!manifest) {
    if (chunkIndex !== 0) {
      throw new Error("Upload must start from the first chunk")
    }

    await writeManifest(uploadId, {
      fileName: sanitizeUploadFileName(fileName),
      mimeType,
      totalChunks,
      nextChunkIndex: 0,
    })
  }

  const currentManifest = (await readManifest(uploadId))!

  if (currentManifest.totalChunks !== totalChunks) {
    throw new Error("Chunk count mismatch")
  }

  if (currentManifest.nextChunkIndex !== chunkIndex) {
    throw new Error("Chunks were received out of order")
  }

  await appendFile(getPartPath(uploadId), chunk)

  const nextChunkIndex = chunkIndex + 1
  if (nextChunkIndex === totalChunks) {
    await rename(getPartPath(uploadId), getCompletedPath(uploadId))
    await writeManifest(uploadId, {
      ...currentManifest,
      nextChunkIndex,
    })
    return {
      completed: true,
      uploadToken: buildBookingUploadToken(uploadId),
    }
  }

  await writeManifest(uploadId, {
    ...currentManifest,
    nextChunkIndex,
  })

  return { completed: false }
}

export async function consumeBookingUpload(uploadToken: string): Promise<ConsumedBookingUpload> {
  const uploadId = parseBookingUploadToken(uploadToken)
  if (!uploadId) {
    throw new Error("Invalid upload token")
  }

  const manifest = await readManifest(uploadId)
  if (!manifest) {
    throw new Error("Upload metadata was not found")
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

  await cleanupUploadId(uploadId)
}
