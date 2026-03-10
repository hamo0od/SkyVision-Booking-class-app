import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { appendBookingUploadChunk } from "@/lib/booking-upload-server"

function decodeHeaderValue(value: string | null): string {
  return value ? decodeURIComponent(value) : ""
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const uploadId = request.headers.get("x-upload-id") || ""
    const fileName = decodeHeaderValue(request.headers.get("x-file-name"))
    const mimeType = decodeHeaderValue(request.headers.get("x-mime-type")) || "application/pdf"
    const chunkIndex = Number.parseInt(request.headers.get("x-chunk-index") || "-1", 10)
    const totalChunks = Number.parseInt(request.headers.get("x-total-chunks") || "0", 10)
    const chunkBuffer = Buffer.from(await request.arrayBuffer())

    const result = await appendBookingUploadChunk({
      uploadId,
      fileName,
      mimeType,
      totalChunks,
      chunkIndex,
      chunk: chunkBuffer,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 400 },
    )
  }
}
