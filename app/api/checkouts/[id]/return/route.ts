import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { returnedById, returnNotes, condition = "Good" } = body

    // Find the checkout
    const checkout = await prisma.itemCheckout.findUnique({
      where: { id },
      include: {
        material: true,
        tool: true,
      },
    })

    if (!checkout) {
      return NextResponse.json({ error: "Checkout not found" }, { status: 404 })
    }

    if (checkout.status === "RETURNED") {
      return NextResponse.json({ error: "Item already returned" }, { status: 400 })
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update checkout record
      const updatedCheckout = await tx.itemCheckout.update({
        where: { id },
        data: {
          status: "RETURNED",
          actualReturnDate: new Date(),
          returnedById,
          returnedDate: new Date(),
          returnNotes,
          condition,
        },
        include: {
          material: {
            select: {
              name: true,
              partNumber: true,
              unit: true,
            },
          },
          tool: {
            select: {
              name: true,
              partNumber: true,
              serialNumber: true,
            },
          },
          user: {
            select: {
              name: true,
              department: true,
            },
          },
          returnedBy: {
            select: {
              name: true,
            },
          },
        },
      })

      // If it's a tool, update tool status
      if (checkout.toolId) {
        await tx.tool.update({
          where: { id: checkout.toolId },
          data: { status: "AVAILABLE" },
        })
      }

      // If it's a non-consumable material, return it to stock
      if (checkout.materialId && checkout.material && !checkout.material.isConsumable) {
        const updatedMaterial = await tx.material.update({
          where: { id: checkout.materialId },
          data: {
            stockQty: {
              increment: checkout.quantity,
            },
          },
        })

        // Create stock movement record
        await tx.stockMovement.create({
          data: {
            materialId: checkout.materialId,
            type: "RETURN",
            quantity: checkout.quantity,
            previousStock: updatedMaterial.stockQty - checkout.quantity,
            newStock: updatedMaterial.stockQty,
            performedById: returnedById,
            notes: `Returned from ${checkout.user.name} - Condition: ${condition}`,
          },
        })
      }

      return updatedCheckout
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error returning item:", error)
    return NextResponse.json({ error: "Failed to return item" }, { status: 500 })
  }
}
