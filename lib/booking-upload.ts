export const MAX_PDF_FILE_SIZE_BYTES = 10 * 1024 * 1024
export const MAX_TOTAL_BOOKING_UPLOAD_SIZE_BYTES = 18 * 1024 * 1024

type BookingUploadFile = {
  file: File | null | undefined
  label: string
}

export function formatUploadSize(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`
}

export function getBookingUploadValidationError(uploadFiles: BookingUploadFile[]): string | null {
  let totalSize = 0

  for (const { file, label } of uploadFiles) {
    if (!file || file.size === 0) {
      continue
    }

    if (file.size > MAX_PDF_FILE_SIZE_BYTES) {
      return `${label} must be less than ${formatUploadSize(MAX_PDF_FILE_SIZE_BYTES)}.`
    }

    totalSize += file.size
  }

  if (totalSize > MAX_TOTAL_BOOKING_UPLOAD_SIZE_BYTES) {
    return `The combined size of uploaded PDF files must be less than ${formatUploadSize(MAX_TOTAL_BOOKING_UPLOAD_SIZE_BYTES)}.`
  }

  return null
}
