"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function createUser(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) throw new Error("Unauthorized")

  // Get the actual admin user from database
  const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!adminUser || adminUser.role !== "ADMIN") throw new Error("Unauthorized - Admin access required")

  const email = formData.get("email") as string
  const username = formData.get("username") as string
  const name = formData.get("name") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as "USER" | "ADMIN"

  if (!email || !username || !name || !password || !role) throw new Error("All fields are required")

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) throw new Error("User with this email already exists")

  const existingUsername = await prisma.user.findUnique({ where: { username } })
  if (existingUsername) throw new Error("Username already taken")

  const hashedPassword = await bcrypt.hash(password, 12)

  try {
    await prisma.user.create({
      data: {
        email,
        username,
        name,
        password: hashedPassword,
        role,
        tokenVersion: 0, // initialize
        passwordUpdatedAt: new Date(),
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
  if (!session?.user?.email) throw new Error("Unauthorized")

  // Get the actual admin user from database
  const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!adminUser || adminUser.role !== "ADMIN") throw new Error("Unauthorized - Admin access required")

  const name = formData.get("name") as string
  const role = formData.get("role") as "USER" | "ADMIN"
  const username = formData.get("username") as string
  const password = formData.get("password") as string | null

  if (!name || !role || !username) throw new Error("Required fields are missing")

  // Check if username already exists (but not for this user)
  const existingUsername = await prisma.user.findUnique({ where: { username } })
  if (existingUsername && (existingUsername as any).id !== userId) {
    throw new Error("Username already taken")
  }

  try {
    const updateData: any = { name, role, username }
    let passwordChanged = false

    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 12)
      updateData.passwordUpdatedAt = new Date()
      updateData.tokenVersion = { increment: 1 } // invalidate existing JWTs
      passwordChanged = true
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    revalidatePath("/admin/users")
    return {
      success: true,
      message: passwordChanged
        ? "Password changed successfully. The user session has been expired."
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
  if (!session?.user?.email) throw new Error("Unauthorized")

  // Get the actual admin user from database
  const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!adminUser || adminUser.role !== "ADMIN") throw new Error("Unauthorized - Admin access required")

  if (adminUser.id === userId) throw new Error("Cannot delete your own account")

  try {
    await prisma.booking.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } })

    revalidatePath("/admin/users")
    return { success: true, message: "User deleted successfully!" }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to delete user. Please try again.")
  }
}
