"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"
import { sanitizeInput } from "@/lib/security"
import {
  MAX_PDF_FILE_SIZE_BYTES,
  formatUploadSize,
  getBookingUploadValidationError,
} from "@/lib/booking-upload"

type BookingActionResult = {
  success: boolean
  message: string
  requestId: string
  errorCode?: string
}

const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/
const DATE_TIME_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
const VALID_DEPARTMENTS = [
  "Cockpit Training",
  "Cabin Crew",
  "Station",
  "OCC",
  "Compliance",
  "Safety",
  "Security",
  "Maintenance",
  "Planning & Engineering",
  "HR & Financial",
  "Commercial & Planning",
  "IT",
  "Meetings",
]

function successResult(requestId: string, message: string): BookingActionResult {
  return { success: true, message, requestId }
}

function errorResult(requestId: string, errorCode: string, message: string): BookingActionResult {
  return { success: false, errorCode, message, requestId }
}

function logBookingError(
  operation: string,
  requestId: string,
  error: unknown,
  context: Record<string, unknown> = {},
) {
  console.error(`[bookings.${operation}]`, {
    requestId,
    context,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
  })
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseDateKey(dateKey: string): Date | null {
  if (!DATE_KEY_REGEX.test(dateKey)) return null
  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-")
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const parsed = new Date(year, month - 1, day, 0, 0, 0, 0)

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return parsed
}

function parseDateTimeLocal(value: string): Date | null {
  const match = DATE_TIME_REGEX.exec(value)
  if (!match) return null

  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw, secondRaw = "0"] = match
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  const second = Number(secondRaw)

  const parsed = new Date(year, month - 1, day, hour, minute, second, 0)

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hour ||
    parsed.getMinutes() !== minute ||
    parsed.getSeconds() !== second
  ) {
    return null
  }

  return parsed
}

function applyTimeToDate(dateKey: string, timeSource: Date): Date | null {
  const baseDate = parseDateKey(dateKey)
  if (!baseDate) return null

  baseDate.setHours(timeSource.getHours(), timeSource.getMinutes(), timeSource.getSeconds(), 0)
  return baseDate
}

function normalizeDateKeys(dateKeys: string[]): string[] {
  const uniqueDates = new Set<string>()
  for (const rawDate of dateKeys) {
    const trimmed = sanitizeInput(rawDate?.trim() || "")
    const parsed = parseDateKey(trimmed)
    if (parsed) uniqueDates.add(formatDateKey(parsed))
  }
  return Array.from(uniqueDates).sort((a, b) => a.localeCompare(b))
}

async function validatePdfFile(
  file: File | null,
  fieldLabel: string,
  requestId: string,
  required: boolean,
): Promise<{ ok: true; buffer: Buffer | null } | { ok: false; result: BookingActionResult }> {
  if (!file || file.size === 0) {
    if (required) {
      return { ok: false, result: errorResult(requestId, "VALIDATION_ERROR", `${fieldLabel} is required`) }
    }
    return { ok: true, buffer: null }
  }

  if (file.size > MAX_PDF_FILE_SIZE_BYTES) {
    return {
      ok: false,
      result: errorResult(
        requestId,
        "VALIDATION_ERROR",
        `${fieldLabel} must be less than ${Math.round(MAX_PDF_FILE_SIZE_BYTES / (1024 * 1024))}MB`,
      ),
    }
  }

  const lowerName = file.name.toLowerCase()
  if (!lowerName.endsWith(".pdf")) {
    return { ok: false, result: errorResult(requestId, "VALIDATION_ERROR", `${fieldLabel} must be a PDF`) }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const signature = buffer.subarray(0, 5).toString("utf8")

  if (signature !== "%PDF-") {
    return { ok: false, result: errorResult(requestId, "VALIDATION_ERROR", `${fieldLabel} must be a valid PDF`) }
  }

  return { ok: true, buffer }
}

// Helper function to delete files
async function deleteFile(filePath: string) {
  try {
    const fullPath = join(process.cwd(), filePath)
    await unlink(fullPath)
    console.log(`Deleted file: ${filePath}`)
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error)
    // Don't throw error - file might already be deleted or not exist
  }
}

// Helper function to extract dates from bulk booking purpose
function extractDatesFromBulkPurpose(purpose: string): string[] {
  if (!purpose.startsWith("BULK_BOOKING:")) {
    return []
  }

  const parts = purpose.split(":")
  if (parts.length < 3) {
    return []
  }

  return normalizeDateKeys(parts[1].split(","))
}

// Helper function to check if two time ranges overlap
function timeRangesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 < end2 && start2 < end1
}

// Helper function to check for booking conflicts
async function checkBookingConflict(classroomId: string, startTime: Date, endTime: Date, excludeBookingId?: string) {
  const whereClause: any = {
    classroomId,
    status: { in: ["PENDING", "APPROVED"] },
  }

  // Exclude a specific booking (useful for updates)
  if (excludeBookingId) {
    whereClause.id = { not: excludeBookingId }
  }

  const existingBookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  // Check each existing booking for conflicts
  for (const booking of existingBookings) {
    if (booking.purpose.startsWith("BULK_BOOKING:")) {
      // Handle bulk booking conflicts
      const bulkDates = extractDatesFromBulkPurpose(booking.purpose)
      const newBookingDateStr = formatDateKey(startTime)

      // Check if the new booking date matches any of the bulk booking dates
      for (const bulkDateStr of bulkDates) {
        const bulkDateFormatted = parseDateKey(bulkDateStr) ? bulkDateStr : ""

        if (newBookingDateStr === bulkDateFormatted) {
          // Same date, now check time overlap
          // Create full datetime objects for the bulk booking on this specific date
          const bulkStartTime = applyTimeToDate(bulkDateStr, booking.startTime)
          const bulkEndTime = applyTimeToDate(bulkDateStr, booking.endTime)

          if (!bulkStartTime || !bulkEndTime) {
            continue
          }

          if (timeRangesOverlap(startTime, endTime, bulkStartTime, bulkEndTime)) {
            return {
              ...booking,
              conflictDate: bulkDateStr,
              conflictStartTime: bulkStartTime,
              conflictEndTime: bulkEndTime,
              isBulkBooking: true,
            }
          }
        }
      }
    } else {
      // Handle regular booking conflicts
      if (timeRangesOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
        return {
          ...booking,
          conflictDate: formatDateKey(booking.startTime),
          conflictStartTime: booking.startTime,
          conflictEndTime: booking.endTime,
          isBulkBooking: false,
        }
      }
    }
  }

  return null
}

export async function createBooking(formData: FormData): Promise<BookingActionResult> {
  const requestId = randomUUID()
  const createdFilePaths: string[] = []
  const cleanupCreatedFiles = async () => {
    for (const filePath of createdFilePaths) {
      await deleteFile(filePath)
    }
    createdFilePaths.length = 0
  }

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return errorResult(requestId, "UNAUTHORIZED", "Your session has expired. Please sign in again.")
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return errorResult(requestId, "UNAUTHORIZED", "Your account was not found. Please contact an administrator.")
    }

    const classroomId = sanitizeInput((formData.get("classroomId") as string | null)?.trim() || "")
    const startTimeRaw = sanitizeInput((formData.get("startTime") as string | null)?.trim() || "")
    const endTimeRaw = sanitizeInput((formData.get("endTime") as string | null)?.trim() || "")
    const purpose = sanitizeInput((formData.get("purpose") as string | null)?.trim() || "")
    const instructorName = sanitizeInput((formData.get("instructorName") as string | null)?.trim() || "")
    const trainingOrder = sanitizeInput((formData.get("trainingOrder") as string | null)?.trim() || "")
    const courseReference = sanitizeInput((formData.get("courseReference") as string | null)?.trim() || "")
    const department = sanitizeInput((formData.get("department") as string | null)?.trim() || "")
    const participants = Number.parseInt((formData.get("participants") as string | null) || "0", 10)
    const ecaaInstructorApprovalRaw = formData.get("ecaaInstructorApproval") as string | null
    const isBulkBooking = formData.get("isBulkBooking") === "true"
    const selectedDates = normalizeDateKeys(formData.getAll("selectedDates") as string[])

    if (!classroomId || !startTimeRaw || !endTimeRaw || !purpose || !instructorName || !trainingOrder || !department) {
      return errorResult(requestId, "VALIDATION_ERROR", "All fields are required.")
    }

    if (!VALID_DEPARTMENTS.includes(department)) {
      return errorResult(requestId, "VALIDATION_ERROR", "Please select a valid department.")
    }

    if (ecaaInstructorApprovalRaw !== "true" && ecaaInstructorApprovalRaw !== "false") {
      return errorResult(requestId, "VALIDATION_ERROR", "Please select your ECAA instructor approval status.")
    }
    const ecaaInstructorApproval = ecaaInstructorApprovalRaw === "true"

    const ecaaApprovalNumber = ecaaInstructorApproval
      ? sanitizeInput((formData.get("ecaaApprovalNumber") as string | null)?.trim() || "")
      : null
    const qualifications = !ecaaInstructorApproval
      ? sanitizeInput((formData.get("qualifications") as string | null)?.trim() || "")
      : null

    if (ecaaInstructorApproval && !ecaaApprovalNumber) {
      return errorResult(requestId, "VALIDATION_ERROR", "ECAA approval number is required.")
    }

    if (!ecaaInstructorApproval && !qualifications) {
      return errorResult(
        requestId,
        "VALIDATION_ERROR",
        "Qualifications are required if you don't have ECAA instructor approval.",
      )
    }

    const startTime = parseDateTimeLocal(startTimeRaw)
    const endTime = parseDateTimeLocal(endTimeRaw)

    if (!startTime || !endTime) {
      return errorResult(requestId, "INVALID_DATE", "Invalid date/time provided.")
    }

    if (startTime >= endTime) {
      return errorResult(requestId, "VALIDATION_ERROR", "End time must be after start time.")
    }

    if (!isBulkBooking && startTime < new Date()) {
      return errorResult(requestId, "VALIDATION_ERROR", "Cannot book time in the past.")
    }

    if (isBulkBooking && selectedDates.length === 0) {
      return errorResult(requestId, "VALIDATION_ERROR", "Please select at least one date for bulk booking.")
    }

    if (!Number.isInteger(participants) || participants < 1) {
      return errorResult(requestId, "VALIDATION_ERROR", "Number of participants must be at least 1.")
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    })

    if (!classroom) {
      return errorResult(requestId, "NOT_FOUND", "Invalid classroom selection.")
    }

    if (participants > classroom.capacity) {
      return errorResult(
        requestId,
        "CAPACITY_EXCEEDED",
        `This classroom can only accommodate ${classroom.capacity} participants.`,
      )
    }

    const ecaaApprovalFile = formData.get("ecaaApprovalFile") as File | null
    const trainingOrderFile = formData.get("trainingOrderFile") as File | null
    const uploadValidationError = getBookingUploadValidationError([
      { file: ecaaApprovalFile, label: "ECAA approval PDF file" },
      { file: trainingOrderFile, label: "Training order PDF file" },
    ])

    if (uploadValidationError) {
      return errorResult(requestId, "VALIDATION_ERROR", uploadValidationError)
    }

    const trainingValidation = await validatePdfFile(trainingOrderFile, "Training order PDF file", requestId, true)
    if (!trainingValidation.ok) return trainingValidation.result

    const ecaaValidation = await validatePdfFile(
      ecaaApprovalFile,
      "ECAA approval PDF file",
      requestId,
      ecaaInstructorApproval,
    )
    if (!ecaaValidation.ok) return ecaaValidation.result

    const uploadDir = join(process.cwd(), "uploads", "bookings")
    await mkdir(uploadDir, { recursive: true })

    let ecaaApprovalFilePath: string | null = null
    let trainingOrderFilePath: string | null = null

    if (ecaaValidation.buffer) {
      const ecaaFileName = `ecaa-${user.id}-${Date.now()}.pdf`
      const ecaaFilePath = join(uploadDir, ecaaFileName)
      await writeFile(ecaaFilePath, ecaaValidation.buffer)
      ecaaApprovalFilePath = `uploads/bookings/${ecaaFileName}`
      createdFilePaths.push(ecaaApprovalFilePath)
    }

    if (trainingValidation.buffer) {
      const trainingFileName = `training-${user.id}-${Date.now()}.pdf`
      const trainingFilePath = join(uploadDir, trainingFileName)
      await writeFile(trainingFilePath, trainingValidation.buffer)
      trainingOrderFilePath = `uploads/bookings/${trainingFileName}`
      createdFilePaths.push(trainingOrderFilePath)
    }

    if (isBulkBooking) {
      const bulkBookingId = `bulk-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

      for (const dateKey of selectedDates) {
        const bookingStartTime = applyTimeToDate(dateKey, startTime)
        const bookingEndTime = applyTimeToDate(dateKey, endTime)

        if (!bookingStartTime || !bookingEndTime) {
          await cleanupCreatedFiles()
          return errorResult(requestId, "INVALID_DATE", `Invalid bulk booking date provided: ${dateKey}`)
        }

        const conflict = await checkBookingConflict(classroomId, bookingStartTime, bookingEndTime)

        if (conflict) {
          const conflictDate = new Date(conflict.conflictDate).toLocaleDateString()
          const conflictStartTime = conflict.conflictStartTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
          const conflictEndTime = conflict.conflictEndTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
          await cleanupCreatedFiles()
          return errorResult(
            requestId,
            "BOOKING_CONFLICT",
            `Time slot conflicts with existing booking on ${conflictDate} from ${conflictStartTime} to ${conflictEndTime}.`,
          )
        }
      }

      const firstDate = selectedDates[0]
      const firstBookingStartTime = applyTimeToDate(firstDate, startTime)
      const firstBookingEndTime = applyTimeToDate(firstDate, endTime)

      if (!firstBookingStartTime || !firstBookingEndTime) {
        await cleanupCreatedFiles()
        return errorResult(requestId, "INVALID_DATE", "Invalid booking date selected.")
      }

      const bulkPurpose = `BULK_BOOKING:${selectedDates.join(",")}:${purpose}`

      await prisma.booking.create({
        data: {
          userId: user.id,
          classroomId,
          startTime: firstBookingStartTime,
          endTime: firstBookingEndTime,
          purpose: bulkPurpose,
          instructorName,
          trainingOrder,
          courseReference: courseReference || null,
          department,
          participants,
          ecaaInstructorApproval,
          ecaaApprovalNumber,
          qualifications,
          ecaaApprovalFile: ecaaApprovalFilePath,
          trainingOrderFile: trainingOrderFilePath,
          bulkBookingId,
        },
      })

      revalidatePath("/dashboard")
      return successResult(requestId, `Bulk booking request for ${selectedDates.length} dates submitted successfully.`)
    }

    const conflict = await checkBookingConflict(classroomId, startTime, endTime)
    if (conflict) {
      const conflictDate = new Date(conflict.conflictDate).toLocaleDateString()
      const conflictStartTime = conflict.conflictStartTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
      const conflictEndTime = conflict.conflictEndTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
      await cleanupCreatedFiles()
      return errorResult(
        requestId,
        "BOOKING_CONFLICT",
        `Time slot conflicts with existing booking on ${conflictDate} from ${conflictStartTime} to ${conflictEndTime}.`,
      )
    }

    await prisma.booking.create({
      data: {
        userId: user.id,
        classroomId,
        startTime,
        endTime,
        purpose,
        instructorName,
        trainingOrder,
        courseReference: courseReference || null,
        department,
        participants,
        ecaaInstructorApproval,
        ecaaApprovalNumber,
        qualifications,
        ecaaApprovalFile: ecaaApprovalFilePath,
        trainingOrderFile: trainingOrderFilePath,
      },
    })

    revalidatePath("/dashboard")
    return successResult(requestId, "Booking request submitted successfully.")
  } catch (error) {
    await cleanupCreatedFiles()

    logBookingError("createBooking", requestId, error)
    return errorResult(
      requestId,
      "BOOKING_CREATE_FAILED",
      "We couldn't create your booking right now. Please try again or contact support.",
    )
  }
}

export async function updateBookingStatus(bookingId: string, status: "APPROVED" | "REJECTED") {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new Error("Unauthorized")
  }

  // Get the actual user from database using email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin access required")
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      throw new Error("Booking not found")
    }

    // If this is a bulk booking, just update the status - don't create individual bookings
    if (booking.purpose.startsWith("BULK_BOOKING:")) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status },
      })

      // If bulk booking is rejected, delete associated files
      if (status === "REJECTED") {
        if (booking.ecaaApprovalFile) {
          await deleteFile(booking.ecaaApprovalFile)
        }
        if (booking.trainingOrderFile) {
          await deleteFile(booking.trainingOrderFile)
        }
      }
    } else {
      // Regular booking
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status },
      })
    }

    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to update booking status")
  }
}

export async function cancelBooking(bookingId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new Error("Unauthorized - No session found")
  }

  // Get the actual user from database using email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    throw new Error("User not found in database")
  }

  // Get the booking with file paths
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  })

  if (!booking) {
    throw new Error("Booking not found")
  }

  // Check if the user owns this booking or is an admin
  if (booking.userId !== user.id && user.role !== "ADMIN") {
    throw new Error("Unauthorized - You can only cancel your own bookings")
  }

  // Check if the booking is already approved and in the past
  const now = new Date()
  if (booking.status === "APPROVED" && booking.startTime < now) {
    throw new Error("Cannot cancel a booking that has already started or ended")
  }

  try {
    // Delete the booking
    await prisma.booking.delete({
      where: { id: bookingId },
    })

    // Delete associated files
    if (booking.ecaaApprovalFile) {
      await deleteFile(booking.ecaaApprovalFile)
    }
    if (booking.trainingOrderFile) {
      await deleteFile(booking.trainingOrderFile)
    }

    revalidatePath("/dashboard")
    revalidatePath("/admin")
    return { success: true, message: "Booking cancelled successfully" }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to cancel booking. Please try again.")
  }
}

export async function deleteBooking(bookingId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new Error("Unauthorized")
  }

  // Get the actual user from database using email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin access required")
  }

  try {
    // Get the booking with file paths before deleting
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      throw new Error("Booking not found")
    }

    // Delete the booking
    await prisma.booking.delete({
      where: { id: bookingId },
    })

    // Delete associated files
    if (booking.ecaaApprovalFile) {
      await deleteFile(booking.ecaaApprovalFile)
    }
    if (booking.trainingOrderFile) {
      await deleteFile(booking.trainingOrderFile)
    }

    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to delete booking")
  }
}

// New function to delete bulk bookings
export async function deleteBulkBooking(bulkBookingId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new Error("Unauthorized")
  }

  // Get the actual user from database using email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin access required")
  }

  try {
    // Get all bookings in the bulk booking with file paths
    const bookings = await prisma.booking.findMany({
      where: { bulkBookingId },
    })

    if (bookings.length === 0) {
      throw new Error("Bulk booking not found")
    }

    // Delete all bookings in the bulk booking
    await prisma.booking.deleteMany({
      where: { bulkBookingId },
    })

    // Delete associated files (only delete unique files to avoid errors)
    const uniqueFiles = new Set<string>()
    bookings.forEach((booking) => {
      if (booking.ecaaApprovalFile) uniqueFiles.add(booking.ecaaApprovalFile)
      if (booking.trainingOrderFile) uniqueFiles.add(booking.trainingOrderFile)
    })

    for (const filePath of uniqueFiles) {
      await deleteFile(filePath)
    }

    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { success: true, message: `Deleted ${bookings.length} bookings from bulk booking` }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to delete bulk booking")
  }
}

// New function to handle booking updates
export async function editBooking(bookingId: string, formData: FormData): Promise<BookingActionResult> {
  const requestId = randomUUID()

  try {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return errorResult(requestId, "UNAUTHORIZED", "Your session has expired. Please sign in again.")
  }

  // Get the actual user from database using email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return errorResult(requestId, "UNAUTHORIZED", "Your account was not found. Please contact an administrator.")
  }

  // Get the existing booking
  const existingBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
  })

  if (!existingBooking) {
    throw new Error("Booking not found")
  }

  // Check if user owns this booking
  if (existingBooking.userId !== user.id) {
    throw new Error("Unauthorized - You can only edit your own bookings")
  }

  // Check if booking is still pending
  if (existingBooking.status !== "PENDING") {
    throw new Error("You can only edit pending bookings")
  }

  const classroomId = sanitizeInput((formData.get("classroomId") as string | null)?.trim() || "")
  const startTimeRaw = sanitizeInput((formData.get("startTime") as string | null)?.trim() || "")
  const endTimeRaw = sanitizeInput((formData.get("endTime") as string | null)?.trim() || "")
  const purpose = sanitizeInput((formData.get("purpose") as string | null)?.trim() || "")
  const instructorName = sanitizeInput((formData.get("instructorName") as string | null)?.trim() || "")
  const trainingOrder = sanitizeInput((formData.get("trainingOrder") as string | null)?.trim() || "")
  const courseReference = sanitizeInput((formData.get("courseReference") as string | null)?.trim() || "")
  const department = sanitizeInput((formData.get("department") as string | null)?.trim() || "")
  const participants = Number.parseInt((formData.get("participants") as string | null) || "0", 10)
  const ecaaInstructorApprovalRaw = formData.get("ecaaInstructorApproval") as string | null

  // Handle bulk booking
  const isBulkBooking = formData.get("isBulkBooking") === "true"
  const selectedDates = normalizeDateKeys(formData.getAll("selectedDates") as string[])

  if (ecaaInstructorApprovalRaw !== "true" && ecaaInstructorApprovalRaw !== "false") {
    throw new Error("Please select your ECAA instructor approval status")
  }
  const ecaaInstructorApproval = ecaaInstructorApprovalRaw === "true"

  const ecaaApprovalNumber = ecaaInstructorApproval
    ? sanitizeInput((formData.get("ecaaApprovalNumber") as string | null)?.trim() || "")
    : null
  const qualifications = !ecaaInstructorApproval
    ? sanitizeInput((formData.get("qualifications") as string | null)?.trim() || "")
    : null

  // Handle file uploads - Make files optional during editing
  const ecaaApprovalFile = formData.get("ecaaApprovalFile") as File | null
  const trainingOrderFile = formData.get("trainingOrderFile") as File | null
  const uploadValidationError = getBookingUploadValidationError([
    { file: ecaaApprovalFile, label: "ECAA approval PDF file" },
    { file: trainingOrderFile, label: "Training order PDF file" },
  ])

  if (!classroomId || !startTimeRaw || !endTimeRaw || !purpose || !instructorName || !trainingOrder || !department) {
    throw new Error("All fields are required")
  }

  if (uploadValidationError) {
    throw new Error(uploadValidationError)
  }

  if (isBulkBooking && selectedDates.length === 0) {
    throw new Error("Please select at least one date for bulk booking")
  }

  // Only validate files if they were actually selected and have size > 0
  if (trainingOrderFile && trainingOrderFile.size > 0) {
    if (trainingOrderFile.type !== "application/pdf") {
      throw new Error("Training order file must be a PDF")
    }
    if (trainingOrderFile.size > MAX_PDF_FILE_SIZE_BYTES) {
      throw new Error(`Training order file must be less than ${formatUploadSize(MAX_PDF_FILE_SIZE_BYTES)}`)
    }
  }

  if (ecaaApprovalFile && ecaaApprovalFile.size > 0) {
    if (ecaaApprovalFile.type !== "application/pdf") {
      throw new Error("ECAA approval file must be a PDF")
    }
    if (ecaaApprovalFile.size > MAX_PDF_FILE_SIZE_BYTES) {
      throw new Error(`ECAA approval file must be less than ${formatUploadSize(MAX_PDF_FILE_SIZE_BYTES)}`)
    }
  }

  if (ecaaInstructorApproval && !ecaaApprovalNumber) {
    throw new Error("ECAA approval number is required")
  }

  if (!ecaaInstructorApproval && !qualifications) {
    throw new Error("Qualifications are required if you don't have ECAA instructor approval")
  }

  if (!VALID_DEPARTMENTS.includes(department)) {
    throw new Error("Please select a valid department")
  }

  const startTime = parseDateTimeLocal(startTimeRaw)
  const endTime = parseDateTimeLocal(endTimeRaw)

  if (!startTime || !endTime) {
    throw new Error("Invalid date/time provided")
  }

  if (startTime >= endTime) {
    throw new Error("End time must be after start time")
  }

  if (participants < 1) {
    throw new Error("Number of participants must be at least 1")
  }

  // Check classroom exists and capacity
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
  })

  if (!classroom) {
    throw new Error("Invalid classroom selection")
  }

  if (participants > classroom.capacity) {
    throw new Error(`This classroom can only accommodate ${classroom.capacity} participants`)
  }

  // Check for conflicts (excluding current booking)
  if (isBulkBooking && selectedDates.length > 0) {
    for (const dateStr of selectedDates) {
      const bookingStartTime = applyTimeToDate(dateStr, startTime)
      const bookingEndTime = applyTimeToDate(dateStr, endTime)

      if (!bookingStartTime || !bookingEndTime) {
        throw new Error("Invalid bulk booking date provided")
      }

      const conflict = await checkBookingConflict(classroomId, bookingStartTime, bookingEndTime, bookingId)

      if (conflict) {
        const conflictDate = new Date(conflict.conflictDate).toLocaleDateString()
        const conflictStartTime = conflict.conflictStartTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
        const conflictEndTime = conflict.conflictEndTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })

        if (conflict.isBulkBooking) {
          throw new Error(
            `Time slot conflicts with existing bulk booking on ${conflictDate} from ${conflictStartTime} to ${conflictEndTime}`,
          )
        } else {
          throw new Error(
            `Time slot conflicts with existing booking on ${conflictDate} from ${conflictStartTime} to ${conflictEndTime}`,
          )
        }
      }
    }
  } else {
    const conflict = await checkBookingConflict(classroomId, startTime, endTime, bookingId)

    if (conflict) {
      const conflictDate = new Date(conflict.conflictDate).toLocaleDateString()
      const conflictStartTime = conflict.conflictStartTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
      const conflictEndTime = conflict.conflictEndTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })

      if (conflict.isBulkBooking) {
        throw new Error(
          `Time slot conflicts with existing bulk booking on ${conflictDate} from ${conflictStartTime} to ${conflictEndTime}`,
        )
      } else {
        throw new Error(
          `Time slot conflicts with existing booking on ${conflictDate} from ${conflictStartTime} to ${conflictEndTime}`,
        )
      }
    }
  }

  // Handle file uploads
  const uploadDir = join(process.cwd(), "uploads", "bookings")
  await mkdir(uploadDir, { recursive: true })

  let ecaaApprovalFilePath: string | null = existingBooking.ecaaApprovalFile
  let trainingOrderFilePath: string | null = existingBooking.trainingOrderFile

  // Delete old files if new ones are provided
  if (ecaaApprovalFile && ecaaApprovalFile.size > 0) {
    if (existingBooking.ecaaApprovalFile) {
      await deleteFile(existingBooking.ecaaApprovalFile)
    }
    const ecaaFileName = `ecaa-${user.id}-${Date.now()}.pdf`
    const ecaaFilePath = join(uploadDir, ecaaFileName)
    const ecaaBuffer = Buffer.from(await ecaaApprovalFile.arrayBuffer())
    await writeFile(ecaaFilePath, ecaaBuffer)
    ecaaApprovalFilePath = `uploads/bookings/${ecaaFileName}`
  }

  if (trainingOrderFile && trainingOrderFile.size > 0) {
    if (existingBooking.trainingOrderFile) {
      await deleteFile(existingBooking.trainingOrderFile)
    }
    const trainingFileName = `training-${user.id}-${Date.now()}.pdf`
    const trainingFilePath = join(uploadDir, trainingFileName)
    const trainingBuffer = Buffer.from(await trainingOrderFile.arrayBuffer())
    await writeFile(trainingFilePath, trainingBuffer)
    trainingOrderFilePath = `uploads/bookings/${trainingFileName}`
  }

  if (isBulkBooking && selectedDates.length > 0) {
      const bulkPurpose = `BULK_BOOKING:${selectedDates.join(",")}:${purpose}`
      const firstDate = selectedDates[0]
      const firstBookingStartTime = applyTimeToDate(firstDate, startTime)
      const firstBookingEndTime = applyTimeToDate(firstDate, endTime)

      if (!firstBookingStartTime || !firstBookingEndTime) {
        throw new Error("Invalid bulk booking date provided")
      }

      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          classroomId,
          startTime: firstBookingStartTime,
          endTime: firstBookingEndTime,
          purpose: bulkPurpose,
          instructorName,
          trainingOrder,
          courseReference: courseReference || null,
          department,
          participants,
          ecaaInstructorApproval,
          ecaaApprovalNumber,
          qualifications,
          ecaaApprovalFile: ecaaApprovalFilePath,
          trainingOrderFile: trainingOrderFilePath,
          status: "PENDING", // Reset status to PENDING after edit
        },
      })

      revalidatePath("/dashboard")
      return successResult(requestId, "Bulk booking updated successfully. Your request is now pending approval.")
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      classroomId,
      startTime,
      endTime,
      purpose,
      instructorName,
      trainingOrder,
      courseReference: courseReference || null,
      department,
      participants,
      ecaaInstructorApproval,
      ecaaApprovalNumber,
      qualifications,
      ecaaApprovalFile: ecaaApprovalFilePath,
      trainingOrderFile: trainingOrderFilePath,
      status: "PENDING", // Reset status to PENDING after edit
    },
  })

  revalidatePath("/dashboard")
  return successResult(requestId, "Booking updated successfully. Your request is now pending approval.")
  } catch (error) {
    logBookingError("editBooking", requestId, error, { bookingId })
    return errorResult(
      requestId,
      "BOOKING_UPDATE_FAILED",
      error instanceof Error
        ? error.message
        : "We couldn't update your booking right now. Please try again later.",
    )
  }
}
