"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

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
  const username = formData.get("username") as string
  const name = formData.get("name") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as "USER" | "ADMIN"

  // Validate inputs
  if (!email || !username || !name || !password || !role) {
    throw new Error("All fields are required")
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error("User with this email already exists")
  }

  // Check if username already exists
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  })

  if (existingUsername) {
    throw new Error("Username already taken")
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 12)

  try {
    await prisma.user.create({
      data: {
        email,
        username,
        name,
        password: hashedPassword,
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
  const username = formData.get("username") as string
  const password = formData.get("password") as string | null

  // Get current user data to fill in missing fields
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!currentUser) {
    throw new Error("User not found")
  }

  // Use current values if not provided in form
  const updateData: any = {
    name: name || currentUser.name,
    role: role || currentUser.role,
    username: username || currentUser.username,
  }

  // Check if username already exists (but not for this user)
  if (username && username !== currentUser.username) {
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUsername && existingUsername.id !== userId) {
      throw new Error("Username already taken")
    }
  }

  // Only update password if provided
  if (password && password.trim() !== "") {
    updateData.password = await bcrypt.hash(password, 12)
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    revalidatePath("/admin/users")
    return {
      success: true,
      message:
        password && password.trim() !== ""
          ? "User updated and password changed successfully!"
          : "User updated successfully!",
    }
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
