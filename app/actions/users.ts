"use server"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { rateLimit } from "@/lib/security"
import {
  createManagedUser,
  deleteManagedUser,
  updateManagedUser,
  UserManagementError,
} from "@/lib/user-management"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

export type UserActionResult = {
  success: boolean
  message: string
  passwordChanged?: boolean
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) throw new UserManagementError("Unauthorized")

  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, role: true },
  })

  if (!adminUser || adminUser.role !== "ADMIN") {
    throw new UserManagementError("Unauthorized - Admin access required")
  }

  return adminUser
}

async function checkRateLimit(action: string, adminId: string, limit: number) {
  const headersList = await headers()
  const forwarded = headersList.get("x-forwarded-for")
  const realIP = headersList.get("x-real-ip")
  const clientIP = forwarded?.split(",")[0].trim() || realIP || "unknown"

  if (!rateLimit(`${action}:${adminId}:${clientIP}`, limit, 60 * 1000).success) {
    throw new UserManagementError("Too many requests. Please try again later.")
  }
}

function failureResult(error: unknown, fallback: string): UserActionResult {
  if (error instanceof UserManagementError) return { success: false, message: error.message }
  return { success: false, message: fallback }
}

export async function createUser(formData: FormData): Promise<UserActionResult> {
  try {
    const admin = await requireAdmin()
    await checkRateLimit("create_user", admin.id, 3)
    await createManagedUser(prisma, formData)
    revalidatePath("/admin/users")
    return { success: true, message: "User created successfully" }
  } catch (error) {
    console.error("Create user error:", error)
    return failureResult(error, "Failed to create user. Please try again.")
  }
}

export async function updateUser(userId: string, formData: FormData): Promise<UserActionResult> {
  try {
    const admin = await requireAdmin()
    await checkRateLimit("update_user", admin.id, 10)
    const { passwordChanged } = await updateManagedUser(prisma, admin.id, userId, formData)
    revalidatePath("/admin/users")

    return {
      success: true,
      passwordChanged,
      message: passwordChanged
        ? "User updated successfully. User has been logged out due to password change."
        : "User updated successfully",
    }
  } catch (error) {
    console.error("Update user error:", error)
    return failureResult(error, "Failed to update user. Please try again.")
  }
}

export async function deleteUser(userId: string): Promise<UserActionResult> {
  try {
    const admin = await requireAdmin()
    await checkRateLimit("delete_user", admin.id, 5)
    await deleteManagedUser(prisma, admin.id, userId)
    revalidatePath("/admin/users")
    return { success: true, message: "User deleted successfully" }
  } catch (error) {
    console.error("Delete user error:", error)
    return failureResult(error, "Failed to delete user. Please try again.")
  }
}

export async function getUsers() {
  await requireAdmin()

  try {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  } catch (error) {
    console.error("Fetch users error:", error)
    throw new Error("Failed to fetch users")
  }
}
