import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Fetch materials
    const materials = await prisma.material.findMany({
      include: {
        category: true,
        location: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    // Fetch tools
    const tools = await prisma.tool.findMany({
      include: {
        category: true,
        location: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    // Combine and format the data
    const allItems = [
      ...materials.map((material) => ({
        id: material.id,
        name: material.name,
        partNumber: material.partNumber,
        stockQty: material.stockQty,
        category: material.category,
        location: material.location,
        type: "material" as const,
      })),
      ...tools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        partNumber: tool.partNumber,
        stockQty: 1, // Tools typically have quantity of 1
        category: tool.category,
        location: tool.location,
        type: "tool" as const,
      })),
    ]

    return NextResponse.json(allItems)
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}
