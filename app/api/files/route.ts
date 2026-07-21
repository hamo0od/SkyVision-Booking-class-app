import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { appendBookingUploadChunk } from "@/lib/booking-upload-server"
import { rateLimit } from "@/lib/security"
import { BOOKING_UPLOAD_CHUNK_SIZE_BYTES } from "@/lib/booking-upload"

function decodeHeaderValue(value: string | null): string {
  return value ? decodeURIComponent(value) : ""
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const contentLength = Number.parseInt(request.headers.get("content-length") || "0", 10)
    if (!Number.isInteger(contentLength) || contentLength < 1 || contentLength > BOOKING_UPLOAD_CHUNK_SIZE_BYTES) {
      return NextResponse.json({ message: "Invalid upload chunk size" }, { status: 413 })
    }

    if (!rateLimit(`booking-upload:${session.user.id}`, 240, 15 * 60 * 1000).success) {
      return NextResponse.json({ message: "Too many upload requests" }, { status: 429 })
    }

    const uploadId = request.headers.get("x-upload-id") || ""
    const fileName = decodeHeaderValue(request.headers.get("x-file-name"))
    const mimeType = decodeHeaderValue(request.headers.get("x-mime-type")) || "application/pdf"
    const chunkIndex = Number.parseInt(request.headers.get("x-chunk-index") || "-1", 10)
    const totalChunks = Number.parseInt(request.headers.get("x-total-chunks") || "0", 10)
    const chunkBuffer = Buffer.from(await request.arrayBuffer())

    const result = await appendBookingUploadChunk({
      ownerId: session.user.id,
      uploadId,
      fileName,
      mimeType,
      totalChunks,
      chunkIndex,
      chunk: chunkBuffer,
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { message: "Upload failed" },
      { status: 400 },
    )
  }
}
