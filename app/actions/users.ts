"use server"

import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { sanitizeInput, validateEmail, validateUsername, validateName } from "@/lib/security"

export async function createUser(formData: FormData) {
  const email = sanitizeInput(formData.get("email") as string)
  const username = sanitizeInput(formData.get("username") as string)
  const name = sanitizeInput(formData.get("name") as string)
  const password = formData.get("password") as string
  const role = formData.get("role") as string

  // Validation
  if (!email || !username || !name || !password || !role) {
    throw new Error("All fields are required")
  }

  if (!validateEmail(email)) {
    throw new Error("Invalid email format")
  }

  if (!validateUsername(username)) {
    throw new Error("Username must be 3-20 characters and contain only letters, numbers, and underscores")
  }

  if (!validateName(name)) {
    throw new Error("Name must be 1-50 characters and contain only letters, spaces, hyphens, and apostrophes")
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long")
  }

  if (!["USER", "ADMIN"].includes(role)) {
    throw new Error("Invalid role")
  }

  try {
    // Check if email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existingUser) {
      throw new Error("Email or username already exists")
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
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
    return { success: true, message: "User created successfully" }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to create user. Please try again.")
  }
}

export async function updateUser(userId: string, formData: FormData) {
  const email = sanitizeInput(formData.get("email") as string)
  const username = sanitizeInput(formData.get("username") as string)
  const name = sanitizeInput(formData.get("name") as string)
  const password = formData.get("password") as string
  const role = formData.get("role") as string

  try {
    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!currentUser) {
      throw new Error("User not found")
    }

    // Use current values if not provided
    const updateData: any = {
      email: email || currentUser.email,
      username: username || currentUser.username,
      name: name || currentUser.name,
      role: (role as "USER" | "ADMIN") || currentUser.role,
    }

    // Validate provided fields
    if (email && !validateEmail(email)) {
      throw new Error("Invalid email format")
    }

    if (username && !validateUsername(username)) {
      throw new Error("Username must be 3-20 characters and contain only letters, numbers, and underscores")
    }

    if (name && !validateName(name)) {
      throw new Error("Name must be 1-50 characters and contain only letters, spaces, hyphens, and apostrophes")
    }

    if (role && !["USER", "ADMIN"].includes(role)) {
      throw new Error("Invalid role")
    }

    // Check if email or username is already taken by another user
    if (email || username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [...(email ? [{ email }] : []), ...(username ? [{ username }] : [])],
            },
          ],
        },
      })

      if (existingUser) {
        throw new Error("Email or username already exists")
      }
    }

    // Handle password update
    let message = "User updated successfully"
    if (password && password.trim() !== "") {
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long")
      }

      updateData.password = await bcrypt.hash(password, 12)
      updateData.tokenVersion = currentUser.tokenVersion + 1 // Invalidate existing sessions
      message = "User updated and password changed successfully. User will be logged out."
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
  try {
    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath("/admin/users")
    return { success: true, message: "User deleted successfully" }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to delete user. Please try again.")
  }
}
