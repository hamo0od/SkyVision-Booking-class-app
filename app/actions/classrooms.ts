"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { sanitizeFormData } from "@/lib/security"

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

  // Sanitize input data
  const sanitizedData = sanitizeFormData(formData)
  const { name, capacity, description } = sanitizedData

  // Validate inputs
  if (!name || !capacity) {
    throw new Error("Name and capacity are required")
  }

  // Validate name (alphanumeric, spaces, and basic punctuation)
  const nameRegex = /^[a-zA-Z0-9\s\-_.]{1,50}$/
  if (!nameRegex.test(name)) {
    throw new Error(
      "Classroom name must be 1-50 characters and contain only letters, numbers, spaces, hyphens, underscores, and periods",
    )
  }

  // Validate capacity
  const capacityNum = Number.parseInt(capacity, 10)
  if (isNaN(capacityNum) || capacityNum < 1 || capacityNum > 1000) {
    throw new Error("Capacity must be a number between 1 and 1000")
  }

  // Validate description length if provided
  if (description && description.length > 500) {
    throw new Error("Description must be less than 500 characters")
  }

  // Check if classroom name already exists
  const existingClassroom = await prisma.classroom.findFirst({
    where: { name },
  })

  if (existingClassroom) {
    throw new Error("A classroom with this name already exists")
  }

  try {
    await prisma.classroom.create({
      data: {
        name,
        capacity: capacityNum,
        description: description || null,
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

  // Sanitize input data
  const sanitizedData = sanitizeFormData(formData)
  const { name, capacity, description } = sanitizedData

  // Get current classroom data
  const currentClassroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
  })

  if (!currentClassroom) {
    throw new Error("Classroom not found")
  }

  // Validate inputs if provided
  if (name) {
    const nameRegex = /^[a-zA-Z0-9\s\-_.]{1,50}$/
    if (!nameRegex.test(name)) {
      throw new Error(
        "Classroom name must be 1-50 characters and contain only letters, numbers, spaces, hyphens, underscores, and periods",
      )
    }
  }

  if (capacity) {
    const capacityNum = Number.parseInt(capacity, 10)
    if (isNaN(capacityNum) || capacityNum < 1 || capacityNum > 1000) {
      throw new Error("Capacity must be a number between 1 and 1000")
    }
  }

  if (description && description.length > 500) {
    throw new Error("Description must be less than 500 characters")
  }

  // Check if new name conflicts with existing classroom
  if (name && name !== currentClassroom.name) {
    const existingClassroom = await prisma.classroom.findFirst({
      where: {
        name,
        id: { not: classroomId },
      },
    })

    if (existingClassroom) {
      throw new Error("A classroom with this name already exists")
    }
  }

  try {
    await prisma.classroom.update({
      where: { id: classroomId },
      data: {
        name: name || currentClassroom.name,
        capacity: capacity ? Number.parseInt(capacity, 10) : currentClassroom.capacity,
        description: description !== undefined ? description || null : currentClassroom.description,
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
    // Delete classroom's bookings first
    await prisma.booking.deleteMany({
      where: { classroomId },
    })

    // Then delete the classroom
    await prisma.classroom.delete({
      where: { id: classroomId },
    })

    revalidatePath("/admin/classrooms")
    return { success: true, message: "Classroom deleted successfully!" }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to delete classroom. Please try again.")
  }
}
