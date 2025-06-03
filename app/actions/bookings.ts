"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

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

  const classroomId = formData.get("classroomId") as string
  const startTime = new Date(formData.get("startTime") as string)
  const endTime = new Date(formData.get("endTime") as string)
  const purpose = formData.get("purpose") as string
  const instructorName = formData.get("instructorName") as string
  const trainingOrder = formData.get("trainingOrder") as string
  const participants = Number.parseInt(formData.get("participants") as string) || 1
  const ecaaApproval = formData.get("ecaaApproval") === "true"
  const approvalNumber = ecaaApproval ? (formData.get("approvalNumber") as string) : null
  const qualifications = !ecaaApproval ? (formData.get("qualifications") as string) : null

  // Validate inputs
  if (!classroomId || !startTime || !endTime || !purpose || !instructorName || !trainingOrder) {
    throw new Error("All fields are required")
  }

  if (startTime >= endTime) {
    throw new Error("End time must be after start time")
  }

  if (startTime < new Date()) {
    throw new Error("Cannot book time in the past")
  }

  // Check maximum session duration (2.5 hours = 150 minutes)
  const durationInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
  const maxDurationInMinutes = 2.5 * 60 // 150 minutes

  if (durationInMinutes > maxDurationInMinutes) {
    throw new Error("Maximum session duration is 2.5 hours (150 minutes)")
  }

  if (participants < 1) {
    throw new Error("Number of participants must be at least 1")
  }

  if (ecaaApproval && !approvalNumber) {
    throw new Error("ECAA approval number is required")
  }

  if (!ecaaApproval && !qualifications) {
    throw new Error("Qualifications are required if you don't have ECAA approval")
  }

  // Check classroom capacity
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
  })

  if (classroom && participants > classroom.capacity) {
    throw new Error(`This classroom can only accommodate ${classroom.capacity} participants`)
  }

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

  try {
    await prisma.booking.create({
      data: {
        userId: user.id,
        classroomId,
        startTime,
        endTime,
        purpose,
        instructorName,
        trainingOrder,
        participants,
        ecaaApproval,
        approvalNumber,
        qualifications,
      },
    })

    revalidatePath("/dashboard")
    return { success: true, message: "Booking request submitted successfully!" }
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
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    })

    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to update booking status")
  }
}

// New function to cancel a booking
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

  // Get the booking
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
    await prisma.booking.delete({
      where: { id: bookingId },
    })

    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to delete booking")
  }
}
