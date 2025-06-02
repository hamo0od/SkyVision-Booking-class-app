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

  // Validate inputs
  if (!classroomId || !startTime || !endTime || !purpose) {
    throw new Error("All fields are required")
  }

  if (startTime >= endTime) {
    throw new Error("End time must be after start time")
  }

  if (startTime < new Date()) {
    throw new Error("Cannot book time in the past")
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
        userId: user.id, // Use the actual user ID from database
        classroomId,
        startTime,
        endTime,
        purpose,
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
