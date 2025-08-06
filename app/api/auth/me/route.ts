import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd get the user ID from a JWT token or session
    // For now, we'll return a mock response or handle it differently

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    // This is a simplified example - in production you'd validate a JWT token
    const userId = authHeader.replace("Bearer ", "")

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        employeeId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Convert role to lowercase for frontend compatibility
    const userData = {
      ...user,
      role: user.role.toLowerCase() as "admin" | "storekeeper" | "technician",
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
