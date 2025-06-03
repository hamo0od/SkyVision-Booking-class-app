"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function changePassword(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return { success: false, message: "Not authenticated" }
    }

    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, message: "All fields are required" }
    }

    if (newPassword !== confirmPassword) {
      return { success: false, message: "New passwords do not match" }
    }

    if (newPassword.length < 6) {
      return { success: false, message: "Password must be at least 6 characters long" }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return { success: false, message: "User not found" }
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return { success: false, message: "Current password is incorrect" }
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    })

    return { success: true, message: "Password changed successfully" }
  } catch (error) {
    console.error("Password change error:", error)
    return { success: false, message: "Failed to change password. Please try again." }
  }
}
