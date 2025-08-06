import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // First check if the table exists
    let users = []
    try {
      users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      })
    } catch (error) {
      console.error("Error fetching users, table may not exist:", error)
      // Return empty array instead of error
      return NextResponse.json({ users: [] })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
