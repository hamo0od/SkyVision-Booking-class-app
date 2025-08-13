"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { sanitizeFormData, validateEmail, validateUsername, validateName, validatePassword } from "@/lib/security"

export async function createUser(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.role || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const sanitized = sanitizeFormData(formData)
  const { email, username, name, password, role } = sanitized

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
    throw new Error("Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes")
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
      throw new Error("Email or username already exists")
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.create({
      data: {
        email,
        username,
        name,
        password: hashedPassword,
        role,
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
  const session = await getServerSession(authOptions)

  if (!session?.user?.role || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const sanitized = sanitizeFormData(formData)

  try {
    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!currentUser) {
      throw new Error("User not found")
    }

    // Use existing values if not provided
    const email = sanitized.email || currentUser.email
    const username = sanitized.username || currentUser.username
    const name = sanitized.name || currentUser.name
    const role = sanitized.role || currentUser.role
    const password = sanitized.password

    // Validation for provided fields
    if (sanitized.email && !validateEmail(email)) {
      throw new Error("Invalid email format")
    }

    if (sanitized.username && !validateUsername(username)) {
      throw new Error("Username must be 3-20 characters and contain only letters, numbers, and underscores")
    }

    if (sanitized.name && !validateName(name)) {
      throw new Error("Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes")
    }

    if (password && !validatePassword(password)) {
      throw new Error("Password must be 6-128 characters long")
    }

    if (sanitized.role && !["USER", "ADMIN"].includes(role)) {
      throw new Error("Invalid role")
    }

    // Check if email or username is already taken by another user
    if (sanitized.email || sanitized.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [...(sanitized.email ? [{ email }] : []), ...(sanitized.username ? [{ username }] : [])],
            },
          ],
        },
      })

      if (existingUser) {
        throw new Error("Email or username already exists")
      }
    }

    // Prepare update data
    const updateData: any = {
      email,
      username,
      name,
      role,
    }

    let passwordChanged = false

    // Only update password if provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 12)
      updateData.tokenVersion = currentUser.tokenVersion + 1 // Invalidate existing sessions
      passwordChanged = true
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    revalidatePath("/admin/users")

    return {
      success: true,
      message: passwordChanged ? "User updated and password changed" : "User updated successfully",
      passwordChanged,
    }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to update user")
  }
}

export async function deleteUser(userId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.role || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  try {
    // Delete user and their bookings (cascade)
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
