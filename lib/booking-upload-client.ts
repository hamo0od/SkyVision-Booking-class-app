import { BOOKING_UPLOAD_CHUNK_SIZE_BYTES } from "@/lib/booking-upload"

type UploadBookingFileOptions = {
  file: File
}

function getErrorMessage(status: number): string {
  if (status === 413) {
    return "The upload request is still too large for the server. Please contact support."
  }

  return "We couldn't upload your file right now. Please try again."
}

export async function uploadBookingFileInChunks({ file }: UploadBookingFileOptions): Promise<string> {
  const uploadId = crypto.randomUUID()
  const totalChunks = Math.max(1, Math.ceil(file.size / BOOKING_UPLOAD_CHUNK_SIZE_BYTES))
  let uploadToken: string | null = null

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    const start = chunkIndex * BOOKING_UPLOAD_CHUNK_SIZE_BYTES
    const end = Math.min(start + BOOKING_UPLOAD_CHUNK_SIZE_BYTES, file.size)
    const chunk = file.slice(start, end)

    const response = await fetch("/api/files", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "x-upload-id": uploadId,
        "x-file-name": encodeURIComponent(file.name),
        "x-mime-type": encodeURIComponent(file.type || "application/pdf"),
        "x-chunk-index": String(chunkIndex),
        "x-total-chunks": String(totalChunks),
      },
      body: chunk,
    })

    if (!response.ok) {
      throw new Error(getErrorMessage(response.status))
    }

    const payload = (await response.json()) as { uploadToken?: string }
    if (payload.uploadToken) {
      uploadToken = payload.uploadToken
    }
  }

  if (!uploadToken) {
    throw new Error("The file upload did not complete successfully.")
  }

  return uploadToken
}
