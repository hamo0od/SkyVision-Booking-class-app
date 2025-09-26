"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// Helper function to check if time ranges overlap
function timeRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const startTime1 = new Date(`2000-01-01 ${start1}`)
  const endTime1 = new Date(`2000-01-01 ${end1}`)
  const startTime2 = new Date(`2000-01-01 ${start2}`)
  const endTime2 = new Date(`2000-01-01 ${end2}`)

  return startTime1 < endTime2 && startTime2 < endTime1
}

// Helper function to extract dates from bulk booking purpose
function extractDatesFromBulkPurpose(purpose: string): string[] {
  try {
    const match = purpose.match(/BULK_BOOKING:(.+)/)
    if (!match) return []

    const dateString = match[1]
    const dates = dateString.split(",").map((date) => date.trim())

    // Convert dates to ISO format for comparison
    return dates.map((date) => {
      const parsedDate = new Date(date)
      return parsedDate.toISOString().split("T")[0]
    })
  } catch (error) {
    console.error("Error extracting dates from bulk purpose:", error)
    return []
  }
}

// Enhanced conflict detection function
async function checkBookingConflict(
  classroomId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string,
): Promise<{ hasConflict: boolean; conflictDetails?: string }> {
  try {
    // Get all bookings for the classroom
    const existingBookings = await db.booking.findMany({
      where: {
        classroomId: classroomId,
        status: {
          in: ["PENDING", "APPROVED"],
        },
        ...(excludeBookingId && {
          id: {
            not: excludeBookingId,
          },
        }),
      },
      include: {
        classroom: true,
        user: true,
      },
    })

    const newBookingDate = new Date(date).toISOString().split("T")[0]

    for (const booking of existingBookings) {
      // Check regular bookings
      if (!booking.purpose.startsWith("BULK_BOOKING:")) {
        const existingBookingDate = new Date(booking.date).toISOString().split("T")[0]

        if (existingBookingDate === newBookingDate) {
          if (timeRangesOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
            return {
              hasConflict: true,
              conflictDetails: `Conflicts with existing booking on ${existingBookingDate} from ${booking.startTime} to ${booking.endTime} by ${booking.user.name}`,
            }
          }
        }
      } else {
        // Check bulk bookings
        const bulkDates = extractDatesFromBulkPurpose(booking.purpose)

        for (const bulkDate of bulkDates) {
          if (bulkDate === newBookingDate) {
            if (timeRangesOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
              return {
                hasConflict: true,
                conflictDetails: `Conflicts with bulk booking on ${bulkDate} from ${booking.startTime} to ${booking.endTime} by ${booking.user.name}`,
              }
            }
          }
        }
      }
    }

    return { hasConflict: false }
  } catch (error) {
    console.error("Error checking booking conflict:", error)
    throw new Error(`Failed to check booking conflicts: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function createBooking(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new Error("Authentication required")
    }

    const classroomId = formData.get("classroomId") as string
    const date = formData.get("date") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const purpose = formData.get("purpose") as string
    const participants = Number.parseInt(formData.get("participants") as string)
    const department = formData.get("department") as string
    const file = formData.get("file") as File | null

    // Validate required fields
    if (!classroomId || !date || !startTime || !endTime || !purpose || !participants || !department) {
      throw new Error("All required fields must be filled")
    }

    // Validate date is not in the past
    const bookingDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (bookingDate < today) {
      throw new Error("Cannot book for past dates")
    }

    // Check for conflicts
    const conflictCheck = await checkBookingConflict(classroomId, date, startTime, endTime)
    if (conflictCheck.hasConflict) {
      throw new Error(conflictCheck.conflictDetails || "Booking conflict detected")
    }

    // Handle file upload if present
    let filePath = null
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        throw new Error("File size must be less than 10MB")
      }

      const uploadsDir = join(process.cwd(), "uploads")
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      const fileName = `${Date.now()}-${file.name}`
      filePath = join(uploadsDir, fileName)

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)
    }

    // Create the booking
    const booking = await db.booking.create({
      data: {
        classroomId,
        userId: session.user.id,
        date: new Date(date),
        startTime,
        endTime,
        purpose,
        participants,
        department,
        filePath,
        status: "PENDING",
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/admin")

    return { success: true, bookingId: booking.id }
  } catch (error) {
    console.error("Error creating booking:", error)
    throw new Error(`Failed to create booking: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function createBulkBooking(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new Error("Authentication required")
    }

    const classroomId = formData.get("classroomId") as string
    const dates = formData.get("dates") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const purpose = formData.get("purpose") as string
    const participants = Number.parseInt(formData.get("participants") as string)
    const department = formData.get("department") as string
    const file = formData.get("file") as File | null

    // Validate required fields
    if (!classroomId || !dates || !startTime || !endTime || !purpose || !participants || !department) {
      throw new Error("All required fields must be filled")
    }

    const dateArray = dates.split(",").map((d) => d.trim())

    // Validate dates are not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const dateStr of dateArray) {
      const bookingDate = new Date(dateStr)
      if (bookingDate < today) {
        throw new Error(`Cannot book for past date: ${dateStr}`)
      }
    }

    // Check for conflicts on each date
    for (const dateStr of dateArray) {
      const conflictCheck = await checkBookingConflict(classroomId, dateStr, startTime, endTime)
      if (conflictCheck.hasConflict) {
        throw new Error(`Conflict on ${dateStr}: ${conflictCheck.conflictDetails}`)
      }
    }

    // Handle file upload if present
    let filePath = null
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        throw new Error("File size must be less than 10MB")
      }

      const uploadsDir = join(process.cwd(), "uploads")
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      const fileName = `${Date.now()}-${file.name}`
      filePath = join(uploadsDir, fileName)

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)
    }

    // Create bulk booking with encoded dates in purpose
    const bulkPurpose = `BULK_BOOKING:${dateArray.join(",")} - ${purpose}`

    const booking = await db.booking.create({
      data: {
        classroomId,
        userId: session.user.id,
        date: new Date(dateArray[0]), // Use first date as primary date
        startTime,
        endTime,
        purpose: bulkPurpose,
        participants,
        department,
        filePath,
        status: "PENDING",
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/admin")

    return { success: true, bookingId: booking.id }
  } catch (error) {
    console.error("Error creating bulk booking:", error)
    throw new Error(`Failed to create bulk booking: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function updateBookingStatus(bookingId: string, status: "APPROVED" | "REJECTED") {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      throw new Error("Admin access required")
    }

    await db.booking.update({
      where: { id: bookingId },
      data: { status },
    })

    revalidatePath("/admin")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error updating booking status:", error)
    throw new Error(`Failed to update booking status: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function cancelBooking(bookingId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new Error("Authentication required")
    }

    // Get the booking to check ownership and file path
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      throw new Error("Booking not found")
    }

    if (booking.userId !== session.user.id && !session.user.isAdmin) {
      throw new Error("You can only cancel your own bookings")
    }

    if (booking.status !== "PENDING") {
      throw new Error("Only pending bookings can be cancelled")
    }

    // Delete associated file if exists
    if (booking.filePath && existsSync(booking.filePath)) {
      try {
        await unlink(booking.filePath)
      } catch (fileError) {
        console.error("Error deleting file:", fileError)
        // Continue with booking deletion even if file deletion fails
      }
    }

    // Delete the booking
    await db.booking.delete({
      where: { id: bookingId },
    })

    revalidatePath("/dashboard")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error cancelling booking:", error)
    throw new Error(`Failed to cancel booking: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function deleteBooking(bookingId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      throw new Error("Admin access required")
    }

    // Get the booking to check for file path
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      throw new Error("Booking not found")
    }

    // Delete associated file if exists
    if (booking.filePath && existsSync(booking.filePath)) {
      try {
        await unlink(booking.filePath)
      } catch (fileError) {
        console.error("Error deleting file:", fileError)
        // Continue with booking deletion even if file deletion fails
      }
    }

    // Delete the booking
    await db.booking.delete({
      where: { id: bookingId },
    })

    revalidatePath("/admin")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error deleting booking:", error)
    throw new Error(`Failed to delete booking: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
