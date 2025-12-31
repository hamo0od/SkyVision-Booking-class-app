"use server"

import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import {
  sanitizeInput,
  validateEmail,
  validateUsername,
  validateName,
  validatePassword,
  rateLimit,
} from "@/lib/security"
import { headers } from "next/headers"

export async function createUser(formData: FormData) {
  // Get client IP for rate limiting
  const headersList = await headers()
  const forwarded = headersList.get("x-forwarded-for")
  const clientIP = forwarded ? forwarded.split(",")[0].trim() : "unknown"

  // Rate limiting
  const rateLimitResult = rateLimit(`create_user:${clientIP}`, 3, 60 * 1000) // 3 attempts per minute
  if (!rateLimitResult.success) {
    throw new Error("Too many requests. Please try again later.")
  }

  // Sanitize and validate inputs
  const email = sanitizeInput(formData.get("email") as string)
  const username = sanitizeInput(formData.get("username") as string)
  const name = sanitizeInput(formData.get("name") as string)
  const password = formData.get("password") as string
  const role = sanitizeInput(formData.get("role") as string)

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
    throw new Error("Name must be 2-50 characters and contain only letters, numbers, spaces, hyphens, and apostrophes")
  }

  if (!validatePassword(password)) {
    throw new Error("Password must be 6-128 characters long")
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
      if (existingUser.email === email) {
        throw new Error("Email already exists")
      }
      if (existingUser.username === username) {
        throw new Error("Username already exists")
      }
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
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to create user. Please try again.")
  }
}

export async function updateUser(userId: string, formData: FormData) {
  // Get client IP for rate limiting
  const headersList = await headers()
  const forwarded = headersList.get("x-forwarded-for")
  const clientIP = forwarded ? forwarded.split(",")[0].trim() : "unknown"

  // Rate limiting
  const rateLimitResult = rateLimit(`update_user:${clientIP}`, 10, 60 * 1000) // 10 attempts per minute
  if (!rateLimitResult.success) {
    throw new Error("Too many requests. Please try again later.")
  }

  try {
    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!currentUser) {
      throw new Error("User not found")
    }

    // Sanitize inputs
    const email = sanitizeInput(formData.get("email") as string) || currentUser.email
    const username = sanitizeInput(formData.get("username") as string) || currentUser.username
    const name = sanitizeInput(formData.get("name") as string) || currentUser.name
    const role = sanitizeInput(formData.get("role") as string) || currentUser.role
    const password = formData.get("password") as string

    // Validate inputs
    if (!validateEmail(email)) {
      throw new Error("Invalid email format")
    }

    if (!validateUsername(username)) {
      throw new Error("Username must be 3-20 characters and contain only letters, numbers, and underscores")
    }

    if (!validateName(name)) {
      throw new Error(
        "Name must be 2-50 characters and contain only letters, numbers, spaces, hyphens, and apostrophes",
      )
    }

    if (!["USER", "ADMIN"].includes(role)) {
      throw new Error("Invalid role")
    }

    // Check if email or username is already taken by another user
    if (email !== currentUser.email || username !== currentUser.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [{ email }, { username }],
            },
          ],
        },
      })

      if (existingUser) {
        if (existingUser.email === email) {
          throw new Error("Email already exists")
        }
        if (existingUser.username === username) {
          throw new Error("Username already exists")
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      email,
      username,
      name,
      role: role as "USER" | "ADMIN",
    }

    // Handle password update
    let passwordChanged = false
    if (password && password.trim() !== "") {
      if (!validatePassword(password)) {
        throw new Error("Password must be 6-128 characters long")
      }

      updateData.password = await bcrypt.hash(password, 12)
      updateData.tokenVersion = currentUser.tokenVersion + 1 // Invalidate existing sessions
      passwordChanged = true
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    revalidatePath("/admin/users")

    const message = passwordChanged
      ? "User updated successfully. User has been logged out due to password change."
      : "User updated successfully"

    return { success: true, message }
  } catch (error) {
    console.error("Database error:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to update user. Please try again.")
  }
}

export async function deleteUser(userId: string) {
  // Get client IP for rate limiting
  const headersList = await headers()
  const forwarded = headersList.get("x-forwarded-for")
  const clientIP = forwarded ? forwarded.split(",")[0].trim() : "unknown"

  // Rate limiting
  const rateLimitResult = rateLimit(`delete_user:${clientIP}`, 5, 60 * 1000) // 5 attempts per minute
  if (!rateLimitResult.success) {
    throw new Error("Too many requests. Please try again later.")
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Delete user (this will cascade delete bookings due to foreign key constraint)
    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath("/admin/users")
    return { success: true, message: "User deleted successfully" }
  } catch (error) {
    console.error("Database error:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to delete user. Please try again.")
  }
}

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return users
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to fetch users")
  }
}
