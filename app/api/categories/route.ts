import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // First check if the table exists
    let categories = []
    try {
      categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
      })
    } catch (error) {
      console.error("Error fetching categories, table may not exist:", error)
      // Return empty array instead of error
      return NextResponse.json([])
    }
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    const category = await prisma.category.create({
      data: { name, description },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
