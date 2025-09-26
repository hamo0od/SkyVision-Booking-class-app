"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import fs from "fs/promises"
import path from "path"

// Enhanced error logging function
function logError(error: any, context: string) {
  const timestamp = new Date().toISOString()
  const errorDetails = {
    timestamp,
    context,
    message: error.message,
    stack: error.stack,
    name: error.name,
  }

  console.error("=== DETAILED ERROR LOG ===")
  console.error(JSON.stringify(errorDetails, null, 2))
  console.error("=== END ERROR LOG ===")

  return errorDetails
}

// Helper function to check if time ranges overlap
function timeRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const startTime1 = new Date(`2000-01-01 ${start1}`)
  const endTime1 = new Date(`2000-01-01 ${end1}`)
  const startTime2 = new Date(`2000-01-01 ${start2}`)
  const endTime2 = new Date(`2000-01-01 ${end2}`)

  return startTime1 < endTime2 && startTime2 < endTime1
}

// Enhanced conflict detection function
async function checkBookingConflict(
  classroomId: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: number,
) {
  try {
    console.log("Checking conflicts for:", { classroomId, date, startTime, endTime, excludeBookingId })

    // Get all bookings for the same classroom and date
    const existingBookings = await db.booking.findMany({
      where: {
        classroomId: classroomId,
        status: {
          in: ["PENDING", "APPROVED"],
        },
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        purpose: true,
        status: true,
      },
    })

    console.log("Found existing bookings:", existingBookings.length)

    for (const booking of existingBookings) {
      // Check if this is a bulk booking
      if (booking.purpose && booking.purpose.includes("BULK_BOOKING:")) {
        // Extract dates from bulk booking purpose
        const bulkDateMatch = booking.purpose.match(/BULK_BOOKING:(.+?)(?:\n|$)/)
        if (bulkDateMatch) {
          const bulkDatesStr = bulkDateMatch[1]
          const bulkDates = bulkDatesStr.split(",").map((d) => d.trim())

          console.log("Bulk booking dates:", bulkDates)

          // Check if any of the bulk dates match our target date
          const targetDate = new Date(date).toISOString().split("T")[0]
          const matchingBulkDate = bulkDates.find((bulkDate) => {
            const bulkDateFormatted = new Date(bulkDate).toISOString().split("T")[0]
            return bulkDateFormatted === targetDate
          })

          if (matchingBulkDate) {
            console.log("Found matching bulk date:", matchingBulkDate)
            // Check time overlap
            if (timeRangesOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
              return {
                hasConflict: true,
                conflictingBooking: {
                  ...booking,
                  isBulkBooking: true,
                  conflictDate: matchingBulkDate,
                },
              }
            }
          }
        }
      } else {
        // Regular booking - check date and time
        const bookingDate = new Date(booking.date).toISOString().split("T")[0]
        const targetDate = new Date(date).toISOString().split("T")[0]

        console.log("Comparing dates:", { bookingDate, targetDate })

        if (bookingDate === targetDate) {
          console.log("Date match found, checking time overlap")
          if (timeRangesOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
            return {
              hasConflict: true,
              conflictingBooking: {
                ...booking,
                isBulkBooking: false,
              },
            }
          }
        }
      }
    }

    return { hasConflict: false }
  } catch (error) {
    logError(error, "checkBookingConflict")
    throw new Error(`Conflict check failed: ${error.message}`)
  }
}

export async function createBooking(formData: FormData) {
  try {
    console.log("=== CREATE BOOKING START ===")

    const session = await getServerSession(authOptions)
    console.log("Session:", session ? "Found" : "Not found")

    if (!session?.user?.email) {
      throw new Error("Authentication required - no session or email found")
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      throw new Error(`User not found for email: ${session.user.email}`)
    }

    console.log("User found:", { id: user.id, email: user.email })

    // Extract form data
    const classroomId = Number.parseInt(formData.get("classroomId") as string)
    const date = formData.get("date") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const purpose = formData.get("purpose") as string
    const participants = Number.parseInt(formData.get("participants") as string)
    const department = formData.get("department") as string
    const isECAA = formData.get("isECAA") === "true"
    const ecaaLicense = (formData.get("ecaaLicense") as string) || null
    const ecaaInstructor = (formData.get("ecaaInstructor") as string) || null

    console.log("Form data:", {
      classroomId,
      date,
      startTime,
      endTime,
      purpose,
      participants,
      department,
      isECAA,
    })

    // Validate required fields
    if (!classroomId || !date || !startTime || !endTime || !purpose || !participants || !department) {
      throw new Error("Missing required fields")
    }

    // Check for conflicts
    const conflictCheck = await checkBookingConflict(classroomId, date, startTime, endTime)

    if (conflictCheck.hasConflict) {
      const conflict = conflictCheck.conflictingBooking
      const conflictType = conflict.isBulkBooking ? "bulk booking" : "booking"
      const conflictDate = conflict.isBulkBooking ? conflict.conflictDate : new Date(conflict.date).toLocaleDateString()

      throw new Error(
        `Time conflict detected! There is already a ${conflictType} for ${conflictDate} ` +
          `from ${conflict.startTime} to ${conflict.endTime}. ` +
          `Your requested time (${startTime} - ${endTime}) overlaps with this existing booking.`,
      )
    }

    // Handle file upload
    let attachmentPath = null
    const file = formData.get("attachment") as File
    if (file && file.size > 0) {
      console.log("Processing file upload:", file.name, file.size)

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        throw new Error("File size must be less than 10MB")
      }

      const uploadsDir = path.join(process.cwd(), "uploads")
      await fs.mkdir(uploadsDir, { recursive: true })

      const fileName = `${Date.now()}-${file.name}`
      const filePath = path.join(uploadsDir, fileName)

      const arrayBuffer = await file.arrayBuffer()
      await fs.writeFile(filePath, Buffer.from(arrayBuffer))

      attachmentPath = `/uploads/${fileName}`
      console.log("File uploaded to:", attachmentPath)
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        classroomId,
        userId: user.id,
        date: new Date(date),
        startTime,
        endTime,
        purpose,
        participants,
        department,
        isECAA,
        ecaaLicense,
        ecaaInstructor,
        attachmentPath,
        status: "PENDING",
      },
    })

    console.log("Booking created:", booking.id)
    console.log("=== CREATE BOOKING END ===")

    revalidatePath("/dashboard")
    revalidatePath("/admin")
    return { success: true, bookingId: booking.id }
  } catch (error) {
    logError(error, "createBooking")
    return {
      success: false,
      error: error.message || "Failed to create booking",
    }
  }
}

export async function createBulkBooking(formData: FormData) {
  try {
    console.log("=== CREATE BULK BOOKING START ===")

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      throw new Error("Authentication required")
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      throw new Error(`User not found for email: ${session.user.email}`)
    }

    const classroomId = Number.parseInt(formData.get("classroomId") as string)
    const dates = JSON.parse(formData.get("dates") as string)
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const purpose = formData.get("purpose") as string
    const participants = Number.parseInt(formData.get("participants") as string)
    const department = formData.get("department") as string
    const isECAA = formData.get("isECAA") === "true"
    const ecaaLicense = (formData.get("ecaaLicense") as string) || null
    const ecaaInstructor = (formData.get("ecaaInstructor") as string) || null

    console.log("Bulk booking data:", { classroomId, dates: dates.length, startTime, endTime })

    // Check for conflicts on each date
    for (const date of dates) {
      const conflictCheck = await checkBookingConflict(classroomId, date, startTime, endTime)

      if (conflictCheck.hasConflict) {
        const conflict = conflictCheck.conflictingBooking
        const conflictType = conflict.isBulkBooking ? "bulk booking" : "booking"
        const conflictDate = conflict.isBulkBooking
          ? conflict.conflictDate
          : new Date(conflict.date).toLocaleDateString()

        throw new Error(
          `Time conflict detected on ${new Date(date).toLocaleDateString()}! ` +
            `There is already a ${conflictType} for ${conflictDate} ` +
            `from ${conflict.startTime} to ${conflict.endTime}.`,
        )
      }
    }

    // Handle file upload
    let attachmentPath = null
    const file = formData.get("attachment") as File
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB")
      }

      const uploadsDir = path.join(process.cwd(), "uploads")
      await fs.mkdir(uploadsDir, { recursive: true })

      const fileName = `${Date.now()}-${file.name}`
      const filePath = path.join(uploadsDir, fileName)

      const arrayBuffer = await file.arrayBuffer()
      await fs.writeFile(filePath, Buffer.from(arrayBuffer))

      attachmentPath = `/uploads/${fileName}`
    }

    // Create bulk booking with special purpose format
    const bulkPurpose = `BULK_BOOKING:${dates.join(",")}\n${purpose}`

    const booking = await db.booking.create({
      data: {
        classroomId,
        userId: user.id,
        date: new Date(dates[0]), // Use first date as primary date
        startTime,
        endTime,
        purpose: bulkPurpose,
        participants,
        department,
        isECAA,
        ecaaLicense,
        ecaaInstructor,
        attachmentPath,
        status: "PENDING",
      },
    })

    console.log("Bulk booking created:", booking.id)
    console.log("=== CREATE BULK BOOKING END ===")

    revalidatePath("/dashboard")
    revalidatePath("/admin")
    return { success: true, bookingId: booking.id }
  } catch (error) {
    logError(error, "createBulkBooking")
    return {
      success: false,
      error: error.message || "Failed to create bulk booking",
    }
  }
}

export async function updateBookingStatus(bookingId: number, status: "APPROVED" | "REJECTED") {
  try {
    console.log("=== UPDATE BOOKING STATUS START ===")

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      throw new Error("Authentication required")
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "ADMIN") {
      throw new Error("Admin access required")
    }

    const booking = await db.booking.update({
      where: { id: bookingId },
      data: { status },
    })

    console.log("Booking status updated:", { id: bookingId, status })
    console.log("=== UPDATE BOOKING STATUS END ===")

    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    logError(error, "updateBookingStatus")
    return {
      success: false,
      error: error.message || "Failed to update booking status",
    }
  }
}

export async function cancelBooking(bookingId: number) {
  try {
    console.log("=== CANCEL BOOKING START ===")

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      throw new Error("Authentication required")
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      throw new Error(`User not found for email: ${session.user.email}`)
    }

    // Get the booking to check ownership
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      throw new Error("Booking not found")
    }

    // Check if user owns the booking or is admin
    if (booking.userId !== user.id && user.role !== "ADMIN") {
      throw new Error("You can only cancel your own bookings")
    }

    // Delete the booking and associated file
    if (booking.attachmentPath) {
      try {
        const filePath = path.join(process.cwd(), booking.attachmentPath.replace("/", ""))
        await fs.unlink(filePath)
        console.log("File deleted:", filePath)
      } catch (fileError) {
        console.warn("Could not delete file:", fileError.message)
      }
    }

    await db.booking.delete({
      where: { id: bookingId },
    })

    console.log("Booking cancelled:", bookingId)
    console.log("=== CANCEL BOOKING END ===")

    revalidatePath("/dashboard")
    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    logError(error, "cancelBooking")
    return {
      success: false,
      error: error.message || "Failed to cancel booking",
    }
  }
}

export async function deleteBooking(bookingId: number) {
  try {
    console.log("=== DELETE BOOKING START ===")

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      throw new Error("Authentication required")
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "ADMIN") {
      throw new Error("Admin access required")
    }

    // Get the booking to delete associated file
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      throw new Error("Booking not found")
    }

    // Delete associated file if exists
    if (booking.attachmentPath) {
      try {
        const filePath = path.join(process.cwd(), booking.attachmentPath.replace("/", ""))
        await fs.unlink(filePath)
        console.log("File deleted:", filePath)
      } catch (fileError) {
        console.warn("Could not delete file:", fileError.message)
      }
    }

    await db.booking.delete({
      where: { id: bookingId },
    })

    console.log("Booking deleted:", bookingId)
    console.log("=== DELETE BOOKING END ===")

    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    logError(error, "deleteBooking")
    return {
      success: false,
      error: error.message || "Failed to delete booking",
    }
  }
}
