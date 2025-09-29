"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

interface BookingFormData {
  classroom: string
  date: string
  startTime: string
  endTime: string
  purpose: string
  participants: string
  department: string
  file?: File
  bulkDates?: string[]
}

// Helper function to check if two time ranges overlap
function timeRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const startTime1 = new Date(`2000-01-01T${start1}:00`)
  const endTime1 = new Date(`2000-01-01T${end1}:00`)
  const startTime2 = new Date(`2000-01-01T${start2}:00`)
  const endTime2 = new Date(`2000-01-01T${end2}:00`)

  return startTime1 < endTime2 && startTime2 < endTime1
}

// Helper function to extract dates from bulk booking purpose
function extractDatesFromBulkPurpose(purpose: string): string[] {
  const match = purpose.match(/BULK_BOOKING:(.+?)(?:\s|$)/)
  if (!match) return []

  const dateString = match[1]
  return dateString.split(",").map((date) => {
    // Convert from YYYY-MM-DD to MM/DD/YYYY format for comparison
    const [year, month, day] = date.split("-")
    return `${month}/${day}/${year}`
  })
}

// Helper function to format date for comparison
function formatDateForComparison(dateStr: string): string {
  const date = new Date(dateStr)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

// Enhanced conflict detection function
async function checkBookingConflict(
  classroomId: string,
  bookingDate: string,
  startTime: string,
  endTime: string,
  bulkDates?: string[],
): Promise<{ hasConflict: boolean; conflictDetails?: string }> {
  try {
    // Get all existing bookings for the classroom
    const existingBookings = await db.booking.findMany({
      where: {
        classroomId: Number.parseInt(classroomId),
        status: {
          in: ["PENDING", "APPROVED"],
        },
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

    const datesToCheck = bulkDates || [bookingDate]

    for (const dateToCheck of datesToCheck) {
      const formattedDateToCheck = formatDateForComparison(dateToCheck)

      for (const existing of existingBookings) {
        let existingDates: string[] = []

        // Check if existing booking is a bulk booking
        if (existing.purpose.startsWith("BULK_BOOKING:")) {
          existingDates = extractDatesFromBulkPurpose(existing.purpose)
        } else {
          // Regular booking - format the date
          existingDates = [formatDateForComparison(existing.date.toISOString())]
        }

        // Check if any of the existing dates match our date to check
        for (const existingDate of existingDates) {
          if (existingDate === formattedDateToCheck) {
            // Same date, now check time overlap
            if (timeRangesOverlap(startTime, endTime, existing.startTime, existing.endTime)) {
              const conflictType = existing.purpose.startsWith("BULK_BOOKING:") ? "bulk booking" : "booking"
              return {
                hasConflict: true,
                conflictDetails: `Conflicts with existing ${conflictType} on ${existingDate} from ${existing.startTime} to ${existing.endTime} (Status: ${existing.status})`,
              }
            }
          }
        }
      }
    }

    return { hasConflict: false }
  } catch (error) {
    console.error("Error checking booking conflict:", error)
    return { hasConflict: false }
  }
}

export async function createBooking(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("You must be logged in to create a booking")
  }

  try {
    const classroom = formData.get("classroom") as string
    const date = formData.get("date") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const purpose = formData.get("purpose") as string
    const participants = formData.get("participants") as string
    const department = formData.get("department") as string
    const file = formData.get("file") as File | null
    const bulkDatesStr = formData.get("bulkDates") as string

    // Validate required fields
    if (!classroom || !purpose || !participants || !department) {
      throw new Error("All required fields must be filled")
    }

    let bulkDates: string[] | undefined
    if (bulkDatesStr) {
      try {
        bulkDates = JSON.parse(bulkDatesStr)
      } catch (e) {
        throw new Error("Invalid bulk dates format")
      }
    }

    // Validate that we have either a single date or bulk dates
    if (!date && (!bulkDates || bulkDates.length === 0)) {
      throw new Error("Please select at least one date")
    }

    if (!startTime || !endTime) {
      throw new Error("Please select start and end times")
    }

    // Validate time range
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)

    if (start >= end) {
      throw new Error("End time must be after start time")
    }

    // Check for conflicts
    const conflictCheck = await checkBookingConflict(classroom, date, startTime, endTime, bulkDates)

    if (conflictCheck.hasConflict) {
      throw new Error(`Booking conflict detected: ${conflictCheck.conflictDetails}`)
    }

    let filePath = null

    // Handle file upload if present
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), "uploads")
      await mkdir(uploadsDir, { recursive: true })

      // Generate unique filename
      const fileExtension = file.name.split(".").pop()
      const fileName = `${uuidv4()}.${fileExtension}`
      filePath = join(uploadsDir, fileName)

      await writeFile(filePath, buffer)
      filePath = `/uploads/${fileName}` // Store relative path for serving
    }

    // Create booking(s)
    if (bulkDates && bulkDates.length > 0) {
      // Create bulk booking with encoded dates in purpose
      const bulkPurpose = `BULK_BOOKING:${bulkDates
        .map((d) => {
          const date = new Date(d)
          return date.toISOString().split("T")[0]
        })
        .join(",")} ${purpose}`

      await db.booking.create({
        data: {
          userId: Number.parseInt(session.user.id),
          classroomId: Number.parseInt(classroom),
          date: new Date(bulkDates[0]), // Use first date as primary date
          startTime,
          endTime,
          purpose: bulkPurpose,
          participants: Number.parseInt(participants),
          department,
          filePath,
          status: "PENDING",
        },
      })
    } else {
      // Create single booking
      await db.booking.create({
        data: {
          userId: Number.parseInt(session.user.id),
          classroomId: Number.parseInt(classroom),
          date: new Date(date),
          startTime,
          endTime,
          purpose,
          participants: Number.parseInt(participants),
          department,
          filePath,
          status: "PENDING",
        },
      })
    }

    revalidatePath("/dashboard")
    revalidatePath("/admin")
    revalidatePath("/timeline")
  } catch (error) {
    console.error("Error creating booking:", error)
    throw error
  }
}

export async function updateBookingStatus(bookingId: number, status: "APPROVED" | "REJECTED") {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    throw new Error("Only admins can update booking status")
  }

  try {
    await db.booking.update({
      where: { id: bookingId },
      data: { status },
    })

    revalidatePath("/admin")
    revalidatePath("/dashboard")
    revalidatePath("/timeline")
  } catch (error) {
    console.error("Error updating booking status:", error)
    throw new Error("Failed to update booking status")
  }
}

export async function cancelBooking(bookingId: number) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("You must be logged in to cancel a booking")
  }

  try {
    // Get the booking to verify ownership
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: { userId: true, status: true },
    })

    if (!booking) {
      throw new Error("Booking not found")
    }

    // Check if user owns the booking or is admin
    if (booking.userId !== Number.parseInt(session.user.id) && !session.user.isAdmin) {
      throw new Error("You can only cancel your own bookings")
    }

    // Only allow canceling pending bookings
    if (booking.status !== "PENDING") {
      throw new Error("Only pending bookings can be canceled")
    }

    await db.booking.update({
      where: { id: bookingId },
      data: { status: "REJECTED" },
    })

    revalidatePath("/dashboard")
    revalidatePath("/admin")
    revalidatePath("/timeline")
  } catch (error) {
    console.error("Error canceling booking:", error)
    throw error
  }
}

export async function deleteBooking(bookingId: number) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    throw new Error("Only admins can delete bookings")
  }

  try {
    await db.booking.delete({
      where: { id: bookingId },
    })

    revalidatePath("/admin")
    revalidatePath("/dashboard")
    revalidatePath("/timeline")
  } catch (error) {
    console.error("Error deleting booking:", error)
    throw new Error("Failed to delete booking")
  }
}
