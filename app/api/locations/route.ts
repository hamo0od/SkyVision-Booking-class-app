import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // First check if the table exists
    let locations = []
    try {
      locations = await prisma.location.findMany({
        orderBy: { name: "asc" },
      })
    } catch (error) {
      console.error("Error fetching locations, table may not exist:", error)
      // Return empty array instead of error
      return NextResponse.json([])
    }
    return NextResponse.json(locations)
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    const location = await prisma.location.create({
      data: { name, description },
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
  }
}
