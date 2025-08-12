"use server"

import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function createUser(formData: FormData) {
  const email = formData.get("email") as string
  const username = formData.get("username") as string
  const name = formData.get("name") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as "USER" | "ADMIN"

  if (!email || !username || !name || !password || !role) {
    throw new Error("All fields are required")
  }

  // Check if email or username already exists
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
  const email = formData.get("email") as string
  const username = formData.get("username") as string
  const name = formData.get("name") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as "USER" | "ADMIN"

  try {
    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!currentUser) {
      throw new Error("User not found")
    }

    // Prepare update data
    const updateData: any = {
      email: email || currentUser.email,
      username: username || currentUser.username,
      name: name || currentUser.name,
      role: role || currentUser.role,
    }

    // If password is provided, hash it and increment tokenVersion
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 12)
      updateData.tokenVersion = currentUser.tokenVersion + 1
    }

    // Check if email or username is taken by another user
    if (email || username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [{ email: updateData.email }, { username: updateData.username }],
            },
          ],
        },
      })

      if (existingUser) {
        throw new Error("Email or username is already taken by another user")
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    revalidatePath("/admin/users")

    const message =
      password && password.trim() !== ""
        ? "User updated and password changed. User will be logged out."
        : "User updated successfully"

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
