"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { sanitizeInput, validateEmail, validateUsername, validatePassword, validateName } from "@/lib/security"

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

  // Sanitize inputs
  const email = sanitizeInput(formData.get("email") as string)
  const username = sanitizeInput(formData.get("username") as string)
  const name = sanitizeInput(formData.get("name") as string)
  const password = formData.get("password") as string
  const role = sanitizeInput(formData.get("role") as string)

  // Validate inputs
  if (!email || !username || !name || !password || !role) {
    throw new Error("All fields are required")
  }

  if (!validateEmail(email)) {
    throw new Error("Please enter a valid email address")
  }

  if (!validateUsername(username)) {
    throw new Error("Username must be 3-20 characters and contain only letters, numbers, and underscores")
  }

  if (!validateName(name)) {
    throw new Error("Name must be 1-50 characters and contain only letters, spaces, hyphens, and apostrophes")
  }

  if (!validatePassword(password)) {
    throw new Error("Password must be at least 6 characters long")
  }

  if (!["USER", "ADMIN"].includes(role)) {
    throw new Error("Invalid role selected")
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  })

  if (existingUser) {
    throw new Error("A user with this email or username already exists")
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12)

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

  // Get current user data
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!currentUser) {
    throw new Error("User not found")
  }

  // Sanitize inputs
  const email = sanitizeInput((formData.get("email") as string) || "")
  const username = sanitizeInput((formData.get("username") as string) || "")
  const name = sanitizeInput((formData.get("name") as string) || "")
  const password = (formData.get("password") as string) || ""
  const role = sanitizeInput((formData.get("role") as string) || "")

  // Validate provided inputs
  if (email && !validateEmail(email)) {
    throw new Error("Please enter a valid email address")
  }

  if (username && !validateUsername(username)) {
    throw new Error("Username must be 3-20 characters and contain only letters, numbers, and underscores")
  }

  if (name && !validateName(name)) {
    throw new Error("Name must be 1-50 characters and contain only letters, spaces, hyphens, and apostrophes")
  }

  if (password && !validatePassword(password)) {
    throw new Error("Password must be at least 6 characters long")
  }

  if (role && !["USER", "ADMIN"].includes(role)) {
    throw new Error("Invalid role selected")
  }

  // Check for conflicts with other users
  if (email || username) {
    const conflictUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: userId } },
          {
            OR: [...(email ? [{ email }] : []), ...(username ? [{ username }] : [])],
          },
        ],
      },
    })

    if (conflictUser) {
      throw new Error("A user with this email or username already exists")
    }
  }

  try {
    const updateData: any = {
      email: email || currentUser.email,
      username: username || currentUser.username,
      name: name || currentUser.name,
      role: (role as "USER" | "ADMIN") || currentUser.role,
    }

    let message = "User updated successfully!"

    // If password is being changed, hash it and increment tokenVersion
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12)
      updateData.password = hashedPassword
      updateData.tokenVersion = currentUser.tokenVersion + 1
      message = "User updated and password changed successfully! They will need to log in again."
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    revalidatePath("/admin/users")
    return { success: true, message }
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

  // Prevent deleting yourself
  if (adminUser.id === userId) {
    throw new Error("You cannot delete your own account")
  }

  try {
    // Delete user's bookings first
    await prisma.booking.deleteMany({
      where: { userId },
    })

    // Delete the user
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
