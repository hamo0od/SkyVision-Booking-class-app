"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createClassroom(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new Error("Unauthorized")
  }

  // Get the actual admin user from database
  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!adminUser || adminUser.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin access required")
  }

  const name = formData.get("name") as string
  const capacity = Number.parseInt(formData.get("capacity") as string)
  const description = formData.get("description") as string

  // Validate inputs
  if (!name || isNaN(capacity)) {
    throw new Error("Name and capacity are required")
  }

  if (capacity <= 0) {
    throw new Error("Capacity must be greater than 0")
  }

  // Check if classroom already exists
  const existingClassroom = await prisma.classroom.findUnique({
    where: { name },
  })

  if (existingClassroom) {
    throw new Error("Classroom with this name already exists")
  }

  try {
    await prisma.classroom.create({
      data: {
        name,
        capacity,
        description,
      },
    })

    revalidatePath("/admin/classrooms")
    return { success: true, message: "Classroom created successfully!" }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to create classroom. Please try again.")
  }
}

export async function updateClassroom(classroomId: string, formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new Error("Unauthorized")
  }

  // Get the actual admin user from database
  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!adminUser || adminUser.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin access required")
  }

  const name = formData.get("name") as string
  const capacity = Number.parseInt(formData.get("capacity") as string)
  const description = formData.get("description") as string

  // Validate inputs
  if (!name || isNaN(capacity)) {
    throw new Error("Name and capacity are required")
  }

  if (capacity <= 0) {
    throw new Error("Capacity must be greater than 0")
  }

  // Check if classroom name already exists (but not for this classroom)
  const existingClassroom = await prisma.classroom.findUnique({
    where: { name },
  })

  if (existingClassroom && existingClassroom.id !== classroomId) {
    throw new Error("Classroom with this name already exists")
  }

  try {
    await prisma.classroom.update({
      where: { id: classroomId },
      data: {
        name,
        capacity,
        description,
      },
    })

    revalidatePath("/admin/classrooms")
    return { success: true, message: "Classroom updated successfully!" }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to update classroom. Please try again.")
  }
}

export async function deleteClassroom(classroomId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new Error("Unauthorized")
  }

  // Get the actual admin user from database
  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!adminUser || adminUser.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin access required")
  }

  try {
    // Check if there are any bookings for this classroom
    const bookingsCount = await prisma.booking.count({
      where: { classroomId },
    })

    if (bookingsCount > 0) {
      throw new Error("Cannot delete classroom with existing bookings")
    }

    // Delete the classroom
    await prisma.classroom.delete({
      where: { id: classroomId },
    })

    revalidatePath("/admin/classrooms")
    return { success: true, message: "Classroom deleted successfully!" }
  } catch (error) {
    console.error("Database error:", error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error("Failed to delete classroom. Please try again.")
  }
}

export async function deleteBooking(bookingId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new Error("Unauthorized")
  }

  // Get the actual admin user from database
  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!adminUser || adminUser.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin access required")
  }

  try {
    await prisma.booking.delete({
      where: { id: bookingId },
    })

    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { success: true, message: "Booking deleted successfully!" }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to delete booking. Please try again.")
  }
}
