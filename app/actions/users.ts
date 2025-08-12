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

  if (!email || !username || !name || !password || !role) {
    throw new Error("All fields are required")
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

  // Get current user data
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!currentUser) {
    throw new Error("User not found")
  }

  const email = formData.get("email") as string
  const username = formData.get("username") as string
  const name = formData.get("name") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as "USER" | "ADMIN"

  // Use existing values if not provided
  const updateData: any = {
    email: email || currentUser.email,
    username: username || currentUser.username,
    name: name || currentUser.name,
    role: role || currentUser.role,
  }

  // Only update password if provided
  let passwordChanged = false
  if (password && password.trim() !== "") {
    updateData.password = await bcrypt.hash(password, 12)
    updateData.tokenVersion = currentUser.tokenVersion + 1 // Invalidate sessions
    passwordChanged = true
  }

  // Check if email or username is already taken by another user
  if (email && email !== currentUser.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })
    if (existingEmail) {
      throw new Error("Email is already taken")
    }
  }

  if (username && username !== currentUser.username) {
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    })
    if (existingUsername) {
      throw new Error("Username is already taken")
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    revalidatePath("/admin/users")

    const message = passwordChanged
      ? "User updated successfully! User has been logged out due to password change."
      : "User updated successfully!"

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

  // Don't allow deleting yourself
  if (userId === adminUser.id) {
    throw new Error("You cannot delete your own account")
  }

  try {
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
