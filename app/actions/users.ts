"use server"

import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function createUser(formData: FormData) {
  const email = formData.get("email") as string
  const username = formData.get("username") as string
  const name = formData.get("name") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as string

  if (!email || !username || !name || !password || !role) {
    throw new Error("All fields are required")
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

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  try {
    await prisma.user.create({
      data: {
        email,
        username,
        name,
        password: hashedPassword,
        role: role as "ADMIN" | "USER",
      },
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to create user. Please try again.")
  }
}

export async function updateUser(userId: string, formData: FormData) {
  const email = formData.get("email") as string
  const username = formData.get("username") as string
  const name = formData.get("name") as string
  const role = formData.get("role") as string

  if (!email || !username || !name || !role) {
    throw new Error("All fields are required")
  }

  // Check if email or username is already taken by another user
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
    throw new Error("Email or username is already taken")
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        email,
        username,
        name,
        role: role as "ADMIN" | "USER",
      },
    })

    revalidatePath("/admin/users")
    return { success: true }
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
    return { success: true }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to delete user. Please try again.")
  }
}
