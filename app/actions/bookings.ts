"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@vercel/postgres"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

// Enhanced error logging function
function logError(error: any, context: string) {
  console.error(`[${context}] Error:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
  })
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
  classroomId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string,
): Promise<{ hasConflict: boolean; conflictDetails?: string }> {
  try {
    console.log("Checking conflicts for:", { classroomId, date, startTime, endTime, excludeBookingId })

    // Format the date consistently
    const bookingDate = new Date(date).toISOString().split("T")[0]

    // Get all bookings for the same classroom and date
    const { rows: existingBookings } = await sql`
      SELECT id, date, start_time, end_time, purpose, status
      FROM bookings 
      WHERE classroom_id = ${classroomId}
      AND status IN ('PENDING', 'APPROVED')
      ${excludeBookingId ? sql`AND id != ${excludeBookingId}` : sql``}
    `

    console.log("Found existing bookings:", existingBookings.length)

    for (const booking of existingBookings) {
      // Check if it's a bulk booking
      if (booking.purpose && booking.purpose.includes("BULK_BOOKING:")) {
        // Extract dates from bulk booking purpose
        const dateMatch = booking.purpose.match(/BULK_BOOKING:(.+?)(?:\s|$)/)
        if (dateMatch) {
          const bulkDates = dateMatch[1].split(",").map((d) => d.trim())
          console.log("Bulk booking dates:", bulkDates)

          // Check if any bulk booking date matches our booking date
          for (const bulkDate of bulkDates) {
            const bulkBookingDate = new Date(bulkDate).toISOString().split("T")[0]
            if (bulkBookingDate === bookingDate) {
              // Check time overlap
              if (timeRangesOverlap(startTime, endTime, booking.start_time, booking.end_time)) {
                return {
                  hasConflict: true,
                  conflictDetails: `Conflicts with bulk booking on ${bulkDate} from ${booking.start_time} to ${booking.end_time} (Status: ${booking.status})`,
                }
              }
            }
          }
        }
      } else {
        // Regular booking - check date and time
        const existingBookingDate = new Date(booking.date).toISOString().split("T")[0]
        if (existingBookingDate === bookingDate) {
          // Check time overlap
          if (timeRangesOverlap(startTime, endTime, booking.start_time, booking.end_time)) {
            return {
              hasConflict: true,
              conflictDetails: `Conflicts with existing booking on ${booking.date} from ${booking.start_time} to ${booking.end_time} (Status: ${booking.status})`,
            }
          }
        }
      }
    }

    return { hasConflict: false }
  } catch (error) {
    logError(error, "checkBookingConflict")
    throw new Error(`Conflict check failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function createBooking(formData: FormData) {
  try {
    console.log("Creating booking with form data:", Object.fromEntries(formData.entries()))

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      throw new Error("Authentication required - no valid session found")
    }

    // Get user from database
    const { rows: users } = await sql`
      SELECT id, email, name, role FROM users WHERE email = ${session.user.email}
    `

    if (users.length === 0) {
      throw new Error(`User not found in database: ${session.user.email}`)
    }

    const user = users[0]
    console.log("Found user:", { id: user.id, email: user.email, role: user.role })

    const classroomId = formData.get("classroomId") as string
    const date = formData.get("date") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const purpose = formData.get("purpose") as string
    const participants = Number.parseInt(formData.get("participants") as string)
    const department = formData.get("department") as string

    // Validate required fields
    if (!classroomId || !date || !startTime || !endTime || !purpose || !participants || !department) {
      throw new Error("Missing required fields")
    }

    // Check for conflicts
    const conflictCheck = await checkBookingConflict(classroomId, date, startTime, endTime)
    if (conflictCheck.hasConflict) {
      throw new Error(`Booking conflict detected: ${conflictCheck.conflictDetails}`)
    }

    // Handle file upload if present
    let fileName = null
    const file = formData.get("file") as File
    if (file && file.size > 0) {
      console.log("Processing file upload:", { name: file.name, size: file.size })

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        throw new Error("File size exceeds 10MB limit")
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), "public", "uploads")
      try {
        await mkdir(uploadsDir, { recursive: true })
      } catch (error) {
        console.log("Uploads directory already exists or created")
      }

      // Generate unique filename
      const timestamp = Date.now()
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      fileName = `${timestamp}_${originalName}`
      const filePath = join(uploadsDir, fileName)

      await writeFile(filePath, buffer)
      console.log("File saved:", filePath)
    }

    // Create the booking
    const { rows } = await sql`
      INSERT INTO bookings (
        user_id, classroom_id, date, start_time, end_time, 
        purpose, participants, department, status, file_path
      )
      VALUES (
        ${user.id}, ${classroomId}, ${date}, ${startTime}, ${endTime},
        ${purpose}, ${participants}, ${department}, 'PENDING', ${fileName}
      )
      RETURNING id
    `

    console.log("Booking created successfully:", rows[0])
    revalidatePath("/dashboard")
    revalidatePath("/admin")

    return { success: true, message: "Booking created successfully!" }
  } catch (error) {
    logError(error, "createBooking")
    throw new Error(`Failed to create booking: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function createBulkBooking(formData: FormData) {
  try {
    console.log("Creating bulk booking with form data:", Object.fromEntries(formData.entries()))

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      throw new Error("Authentication required - no valid session found")
    }

    // Get user from database
    const { rows: users } = await sql`
      SELECT id, email, name, role FROM users WHERE email = ${session.user.email}
    `

    if (users.length === 0) {
      throw new Error(`User not found in database: ${session.user.email}`)
    }

    const user = users[0]

    const classroomId = formData.get("classroomId") as string
    const dates = formData.get("dates") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const purpose = formData.get("purpose") as string
    const participants = Number.parseInt(formData.get("participants") as string)
    const department = formData.get("department") as string

    if (!classroomId || !dates || !startTime || !endTime || !purpose || !participants || !department) {
      throw new Error("Missing required fields for bulk booking")
    }

    const dateList = dates.split(",").map((d) => d.trim())
    console.log("Processing bulk booking for dates:", dateList)

    // Check for conflicts on each date
    for (const date of dateList) {
      const conflictCheck = await checkBookingConflict(classroomId, date, startTime, endTime)
      if (conflictCheck.hasConflict) {
        throw new Error(`Booking conflict on ${date}: ${conflictCheck.conflictDetails}`)
      }
    }

    // Handle file upload
    let fileName = null
    const file = formData.get("file") as File
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size exceeds 10MB limit")
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadsDir = join(process.cwd(), "public", "uploads")
      try {
        await mkdir(uploadsDir, { recursive: true })
      } catch (error) {
        console.log("Uploads directory already exists or created")
      }

      const timestamp = Date.now()
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      fileName = `${timestamp}_${originalName}`
      const filePath = join(uploadsDir, fileName)

      await writeFile(filePath, buffer)
    }

    // Create bulk booking with special purpose format
    const bulkPurpose = `BULK_BOOKING:${dates} - ${purpose}`

    const { rows } = await sql`
      INSERT INTO bookings (
        user_id, classroom_id, date, start_time, end_time, 
        purpose, participants, department, status, file_path
      )
      VALUES (
        ${user.id}, ${classroomId}, ${dateList[0]}, ${startTime}, ${endTime},
        ${bulkPurpose}, ${participants}, ${department}, 'PENDING', ${fileName}
      )
      RETURNING id
    `

    console.log("Bulk booking created successfully:", rows[0])
    revalidatePath("/dashboard")
    revalidatePath("/admin")

    return { success: true, message: `Bulk booking created for ${dateList.length} dates!` }
  } catch (error) {
    logError(error, "createBulkBooking")
    throw new Error(`Failed to create bulk booking: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function updateBookingStatus(bookingId: string, status: "APPROVED" | "REJECTED") {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      throw new Error("Authentication required")
    }

    // Get user and verify admin role
    const { rows: users } = await sql`
      SELECT id, role FROM users WHERE email = ${session.user.email}
    `

    if (users.length === 0 || users[0].role !== "ADMIN") {
      throw new Error("Admin access required")
    }

    await sql`
      UPDATE bookings 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${bookingId}
    `

    revalidatePath("/admin")
    revalidatePath("/dashboard")

    return { success: true, message: `Booking ${status.toLowerCase()} successfully!` }
  } catch (error) {
    logError(error, "updateBookingStatus")
    throw new Error(`Failed to update booking status: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function cancelBooking(bookingId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      throw new Error("Authentication required")
    }

    // Get user from database
    const { rows: users } = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `

    if (users.length === 0) {
      throw new Error("User not found")
    }

    const user = users[0]

    // Verify the booking belongs to the user and is pending
    const { rows: bookings } = await sql`
      SELECT id, status FROM bookings 
      WHERE id = ${bookingId} AND user_id = ${user.id}
    `

    if (bookings.length === 0) {
      throw new Error("Booking not found or access denied")
    }

    if (bookings[0].status !== "PENDING") {
      throw new Error("Only pending bookings can be cancelled")
    }

    // Update booking status to cancelled
    await sql`
      UPDATE bookings 
      SET status = 'CANCELLED', updated_at = NOW()
      WHERE id = ${bookingId}
    `

    revalidatePath("/dashboard")
    revalidatePath("/admin")

    return { success: true, message: "Booking cancelled successfully!" }
  } catch (error) {
    logError(error, "cancelBooking")
    throw new Error(`Failed to cancel booking: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function deleteBooking(bookingId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      throw new Error("Authentication required")
    }

    // Get user and verify admin role
    const { rows: users } = await sql`
      SELECT id, role FROM users WHERE email = ${session.user.email}
    `

    if (users.length === 0 || users[0].role !== "ADMIN") {
      throw new Error("Admin access required")
    }

    // Get booking details for file cleanup
    const { rows: bookings } = await sql`
      SELECT file_path FROM bookings WHERE id = ${bookingId}
    `

    // Delete the booking
    await sql`DELETE FROM bookings WHERE id = ${bookingId}`

    // Clean up file if exists
    if (bookings.length > 0 && bookings[0].file_path) {
      try {
        const filePath = join(process.cwd(), "public", "uploads", bookings[0].file_path)
        await import("fs/promises").then((fs) => fs.unlink(filePath))
      } catch (fileError) {
        console.log("File cleanup failed (file may not exist):", fileError)
      }
    }

    revalidatePath("/admin")
    revalidatePath("/dashboard")

    return { success: true, message: "Booking deleted successfully!" }
  } catch (error) {
    logError(error, "deleteBooking")
    throw new Error(`Failed to delete booking: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
