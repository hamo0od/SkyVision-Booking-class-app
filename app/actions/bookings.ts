"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { sanitizeInput } from "@/lib/security"

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

export async function createBooking(formData: FormData) {
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

  const classroomId = sanitizeInput((formData.get("classroomId") as string | null)?.trim() || "")
  const startTimeRaw = formData.get("startTime") as string | null
  const endTimeRaw = formData.get("endTime") as string | null
  const purpose = sanitizeInput((formData.get("purpose") as string | null)?.trim() || "")
  const instructorName = sanitizeInput((formData.get("instructorName") as string | null)?.trim() || "")
  const trainingOrder = sanitizeInput((formData.get("trainingOrder") as string | null)?.trim() || "")
  const courseReference = sanitizeInput((formData.get("courseReference") as string | null)?.trim() || "")
  const participants = Number.parseInt((formData.get("participants") as string | null) || "0", 10)
  const ecaaInstructorApprovalRaw = formData.get("ecaaInstructorApproval") as string | null

  // Handle bulk booking
  const isBulkBooking = formData.get("isBulkBooking") === "true"
  const selectedDates = formData.getAll("selectedDates") as string[]

  // Require explicit ECAA choice: must be "true" or "false"
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

  // Handle file uploads
  const ecaaApprovalFile = formData.get("ecaaApprovalFile") as File | null
  const trainingOrderFile = formData.get("trainingOrderFile") as File | null

  if (!classroomId || !startTimeRaw || !endTimeRaw || !purpose || !instructorName || !trainingOrder) {
    throw new Error("All fields are required")
  }

  if (!trainingOrderFile) {
    throw new Error("Training order PDF file is required")
  }

  if (ecaaInstructorApproval && !ecaaApprovalFile) {
    throw new Error("ECAA approval PDF file is required when you have ECAA instructor approval")
  }

  if (ecaaInstructorApproval && !ecaaApprovalNumber) {
    throw new Error("ECAA approval number is required")
  }

  if (!ecaaInstructorApproval && !qualifications) {
    throw new Error("Qualifications are required if you don't have ECAA instructor approval")
  }

  // Validate file types and sizes
  if (ecaaApprovalFile) {
    if (ecaaApprovalFile.type !== "application/pdf") {
      throw new Error("ECAA approval file must be a PDF")
    }
    if (ecaaApprovalFile.size > 10 * 1024 * 1024) {
      // 10MB
      throw new Error("ECAA approval file must be less than 10MB")
    }
  }

  if (trainingOrderFile.type !== "application/pdf") {
    throw new Error("Training order file must be a PDF")
  }
  if (trainingOrderFile.size > 10 * 1024 * 1024) {
    // 10MB
    throw new Error("Training order file must be less than 10MB")
  }

  const startTime = new Date(startTimeRaw)
  const endTime = new Date(endTimeRaw)

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new Error("Invalid date/time provided")
  }

  if (startTime >= endTime) {
    throw new Error("End time must be after start time")
  }

  if (startTime < new Date()) {
    throw new Error("Cannot book time in the past")
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

  // Save uploaded files
  const uploadDir = join(process.cwd(), "uploads", "bookings")
  await mkdir(uploadDir, { recursive: true })

  let ecaaApprovalFilePath: string | null = null
  let trainingOrderFilePath: string | null = null

  if (ecaaApprovalFile) {
    const ecaaFileName = `ecaa-${user.id}-${Date.now()}.pdf`
    ecaaApprovalFilePath = join(uploadDir, ecaaFileName)
    const ecaaBuffer = Buffer.from(await ecaaApprovalFile.arrayBuffer())
    await writeFile(ecaaApprovalFilePath, ecaaBuffer)
    ecaaApprovalFilePath = `uploads/bookings/${ecaaFileName}`
  }

  const trainingFileName = `training-${user.id}-${Date.now()}.pdf`
  trainingOrderFilePath = join(uploadDir, trainingFileName)
  const trainingBuffer = Buffer.from(await trainingOrderFile.arrayBuffer())
  await writeFile(trainingOrderFilePath, trainingBuffer)
  trainingOrderFilePath = `uploads/bookings/${trainingFileName}`

  try {
    if (isBulkBooking && selectedDates.length > 0) {
      // Handle bulk booking - create ONE booking with multiple dates stored as JSON
      const bulkBookingId = `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Check for conflicts for each date
      for (const dateStr of selectedDates) {
        const bookingStartTime = new Date(`${dateStr}T${startTime.toTimeString().split(" ")[0]}`)
        const bookingEndTime = new Date(`${dateStr}T${endTime.toTimeString().split(" ")[0]}`)

        const conflict = await prisma.booking.findFirst({
          where: {
            classroomId,
            status: { in: ["PENDING", "APPROVED"] },
            OR: [
              {
                startTime: { lte: bookingStartTime },
                endTime: { gt: bookingStartTime },
              },
              {
                startTime: { lt: bookingEndTime },
                endTime: { gte: bookingEndTime },
              },
              {
                startTime: { gte: bookingStartTime },
                endTime: { lte: bookingEndTime },
              },
            ],
          },
        })

        if (conflict) {
          throw new Error(`Time slot conflicts with existing booking on ${dateStr}`)
        }
      }

      // Create a single booking record representing the bulk booking
      // Use the first date for the main booking record
      const firstDate = selectedDates[0]
      const firstBookingStartTime = new Date(`${firstDate}T${startTime.toTimeString().split(" ")[0]}`)
      const firstBookingEndTime = new Date(`${firstDate}T${endTime.toTimeString().split(" ")[0]}`)

      // Store all selected dates in the purpose field with a special format
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
      return {
        success: true,
        message: `Bulk booking request for ${selectedDates.length} dates submitted successfully!`,
      }
    } else {
      // Single booking
      // Check for conflicts
      const conflict = await prisma.booking.findFirst({
        where: {
          classroomId,
          status: { in: ["PENDING", "APPROVED"] },
          OR: [
            {
              startTime: { lte: startTime },
              endTime: { gt: startTime },
            },
            {
              startTime: { lt: endTime },
              endTime: { gte: endTime },
            },
            {
              startTime: { gte: startTime },
              endTime: { lte: endTime },
            },
          ],
        },
      })

      if (conflict) {
        throw new Error("Time slot conflicts with existing booking")
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
          participants,
          ecaaInstructorApproval,
          ecaaApprovalNumber,
          qualifications,
          ecaaApprovalFile: ecaaApprovalFilePath,
          trainingOrderFile: trainingOrderFilePath,
        },
      })

      revalidatePath("/dashboard")
      return { success: true, message: "Booking request submitted successfully!" }
    }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to create booking. Please try again.")
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

    // If this is a bulk booking and being approved, create individual bookings for each date
    if (status === "APPROVED" && booking.purpose.startsWith("BULK_BOOKING:")) {
      const [, datesStr, actualPurpose] = booking.purpose.split(":", 3)
      const dates = datesStr.split(",")

      // Create individual bookings for each date
      const bookings = dates.map((dateStr) => {
        const bookingStartTime = new Date(`${dateStr}T${booking.startTime.toTimeString().split(" ")[0]}`)
        const bookingEndTime = new Date(`${dateStr}T${booking.endTime.toTimeString().split(" ")[0]}`)

        return {
          userId: booking.userId,
          classroomId: booking.classroomId,
          startTime: bookingStartTime,
          endTime: bookingEndTime,
          purpose: actualPurpose,
          status: "APPROVED" as const,
          participants: booking.participants,
          instructorName: booking.instructorName,
          trainingOrder: booking.trainingOrder,
          courseReference: booking.courseReference,
          ecaaInstructorApproval: booking.ecaaInstructorApproval,
          ecaaApprovalNumber: booking.ecaaApprovalNumber,
          qualifications: booking.qualifications,
          ecaaApprovalFile: booking.ecaaApprovalFile,
          trainingOrderFile: booking.trainingOrderFile,
          bulkBookingId: booking.bulkBookingId,
        }
      })

      // Create all individual bookings
      await prisma.booking.createMany({
        data: bookings,
      })

      // Delete the original bulk booking request
      await prisma.booking.delete({
        where: { id: bookingId },
      })
    } else {
      // Regular booking or bulk booking rejection
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status },
      })

      // If bulk booking is rejected, delete associated files
      if (status === "REJECTED" && booking.purpose.startsWith("BULK_BOOKING:")) {
        if (booking.ecaaApprovalFile) {
          await deleteFile(booking.ecaaApprovalFile)
        }
        if (booking.trainingOrderFile) {
          await deleteFile(booking.trainingOrderFile)
        }
      }
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
