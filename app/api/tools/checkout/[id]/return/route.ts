import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { returnedById } = body

    // Check if the checkout exists
    const checkout = await prisma.toolCheckout.findUnique({
      where: { id },
      include: {
        tool: true,
      },
    })

    if (!checkout) {
      return NextResponse.json({ error: "Checkout not found" }, { status: 404 })
    }

    if (checkout.status === "RETURNED") {
      return NextResponse.json({ error: "Tool has already been returned" }, { status: 400 })
    }

    // Update the checkout
    const updatedCheckout = await prisma.toolCheckout.update({
      where: { id },
      data: {
        status: "RETURNED",
        returnDate: new Date(),
        returnedById,
      },
      include: {
        tool: {
          include: {
            material: true,
          },
        },
        user: true,
      },
    })

    return NextResponse.json({ checkout: updatedCheckout }, { status: 200 })
  } catch (error) {
    console.error("Error returning tool:", error)
    return NextResponse.json({ error: "Failed to return tool" }, { status: 500 })
  }
}
