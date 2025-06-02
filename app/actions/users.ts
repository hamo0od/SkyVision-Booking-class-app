"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createUser(formData: FormData) {
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

  const email = formData.get("email") as string
  const name = formData.get("name") as string
  const role = formData.get("role") as "USER" | "ADMIN"

  // Validate inputs
  if (!email || !name || !role) {
    throw new Error("All fields are required")
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error("User with this email already exists")
  }

  try {
    await prisma.user.create({
      data: {
        email,
        name,
        role,
      },
    })

    revalidatePath("/admin/users")
    return { success: true, message: "User created successfully!" }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to create user. Please try again.")
  }
}

export async function updateUser(userId: string, formData: FormData) {
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
  const role = formData.get("role") as "USER" | "ADMIN"

  if (!name || !role) {
    throw new Error("All fields are required")
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name, role },
    })

    revalidatePath("/admin/users")
    return { success: true, message: "User updated successfully!" }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to update user. Please try again.")
  }
}

export async function deleteUser(userId: string) {
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

  // Prevent admin from deleting themselves
  if (adminUser.id === userId) {
    throw new Error("Cannot delete your own account")
  }

  try {
    // Delete user's bookings first
    await prisma.booking.deleteMany({
      where: { userId },
    })

    // Then delete the user
    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath("/admin/users")
    return { success: true, message: "User deleted successfully!" }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to delete user. Please try again.")
  }
}
