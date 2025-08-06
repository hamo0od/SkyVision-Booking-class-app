import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const material = await prisma.material.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        location: true,
        createdBy: { select: { name: true } },
        updatedBy: { select: { name: true } },
        tool: true,
        aircraftTypes: true,
      },
    })

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 })
    }

    return NextResponse.json(material)
  } catch (error) {
    console.error("Error fetching material:", error)
    return NextResponse.json({ error: "Failed to fetch material" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
      updatedById,
      aircraftTypeIds = [],
      status,
    } = body

    const material = await prisma.material.update({
      where: { id: params.id },
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
        updatedById,
        status,
        aircraftTypes: {
          set: aircraftTypeIds.map((id: string) => ({ id })),
        },
      },
      include: {
        category: true,
        location: true,
        createdBy: { select: { name: true } },
        updatedBy: { select: { name: true } },
        tool: true,
        aircraftTypes: true,
      },
    })

    return NextResponse.json(material)
  } catch (error) {
    console.error("Error updating material:", error)
    return NextResponse.json({ error: "Failed to update material" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.material.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Material deleted successfully" })
  } catch (error) {
    console.error("Error deleting material:", error)
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 })
  }
}
