import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // First check if the table exists
    let materials = []
    try {
      materials = await prisma.material.findMany({
        include: {
          category: true,
          location: true,
          createdBy: {
            select: { name: true },
          },
          updatedBy: {
            select: { name: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    } catch (error) {
      console.error("Error fetching materials, table may not exist:", error)
      // Return empty array instead of error
      return NextResponse.json([])
    }

    return NextResponse.json(materials)
  } catch (error) {
    console.error("Error fetching materials:", error)
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      partNumber,
      serialNumber,
      name,
      description,
      categoryId,
      locationId,
      stockQty,
      unit,
      minimumLevel,
      createdById,
      aircraftTypeIds = [],
      isReturnable = false,
    } = body

    const material = await prisma.material.create({
      data: {
        partNumber,
        serialNumber,
        name,
        description,
        categoryId,
        locationId,
        stockQty: Number.parseInt(stockQty),
        unit,
        minimumLevel: Number.parseInt(minimumLevel),
        createdById,
        updatedById: createdById,
      },
      include: {
        category: true,
        location: true,
        createdBy: { select: { name: true } },
        updatedBy: { select: { name: true } },
      },
    })

    return NextResponse.json(material, { status: 201 })
  } catch (error) {
    console.error("Error creating material:", error)
    return NextResponse.json({ error: "Failed to create material" }, { status: 500 })
  }
}
