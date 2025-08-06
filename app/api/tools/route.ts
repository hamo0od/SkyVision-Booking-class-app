import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // First check if the table exists
    let tools = []
    try {
      tools = await prisma.tool.findMany({
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
      console.error("Error fetching tools, table may not exist:", error)
      // Return empty array instead of error
      return NextResponse.json([])
    }

    return NextResponse.json(tools)
  } catch (error) {
    console.error("Error fetching tools:", error)
    return NextResponse.json({ error: "Failed to fetch tools" }, { status: 500 })
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
      status,
      maxCheckoutDays,
      requiresCalibration,
      lastMaintenanceDate,
      nextMaintenanceDate,
      createdById,
      aircraftTypeIds = [],
    } = body

    const tool = await prisma.tool.create({
      data: {
        partNumber,
        serialNumber,
        name,
        description,
        categoryId,
        locationId,
        status: status || "AVAILABLE",
        maxCheckoutDays: maxCheckoutDays ? Number.parseInt(maxCheckoutDays) : 7,
        requiresCalibration: requiresCalibration || false,
        lastMaintenanceDate,
        nextMaintenanceDate,
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

    return NextResponse.json(tool, { status: 201 })
  } catch (error) {
    console.error("Error creating tool:", error)
    return NextResponse.json({ error: "Failed to create tool" }, { status: 500 })
  }
}
