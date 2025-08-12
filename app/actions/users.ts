"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { sanitizeFormData } from "@/lib/security"

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

  // Sanitize input data
  const sanitizedData = sanitizeFormData(formData)
  const { email, username, name, password, role } = sanitizedData

  // Validate inputs
  if (!email || !username || !name || !password || !role) {
    throw new Error("All fields are required")
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format")
  }

  // Validate username (alphanumeric and underscore only)
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  if (!usernameRegex.test(username)) {
    throw new Error("Username must be 3-20 characters and contain only letters, numbers, and underscores")
  }

  // Validate password strength
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long")
  }

  // Validate role
  if (!["USER", "ADMIN"].includes(role)) {
    throw new Error("Invalid role")
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  })

  if (existingUser) {
    throw new Error("User with this email or username already exists")
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
        role: role as "USER" | "ADMIN",
        tokenVersion: 0,
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

  // Sanitize input data
  const sanitizedData = sanitizeFormData(formData)
  const { name, role, username, password } = sanitizedData

  // Get current user data to fill in missing fields
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!currentUser) {
    throw new Error("User not found")
  }

  // Validate inputs if provided
  if (username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      throw new Error("Username must be 3-20 characters and contain only letters, numbers, and underscores")
    }
  }

  if (role && !["USER", "ADMIN"].includes(role)) {
    throw new Error("Invalid role")
  }

  if (password && password.length < 6) {
    throw new Error("Password must be at least 6 characters long")
  }

  // Use current values if not provided in form
  const updateData: any = {
    name: name || currentUser.name,
    role: (role as "USER" | "ADMIN") || currentUser.role,
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

  let passwordChanged = false

  // Only update password if provided
  if (password && password.trim() !== "") {
    updateData.password = await bcrypt.hash(password, 12)
    // Increment tokenVersion to invalidate all existing sessions
    updateData.tokenVersion = currentUser.tokenVersion + 1
    passwordChanged = true
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    revalidatePath("/admin/users")
    return {
      success: true,
      message: passwordChanged
        ? "User updated and password changed successfully! User will be logged out."
        : "User updated successfully!",
      passwordChanged,
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
