import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or storekeeper
    if (!["ADMIN", "STOREKEEPER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Only admins and storekeepers can reject returns" }, { status: 403 })
    }

    const checkoutId = params.id
    const { reason } = await request.json()

    // Find the checkout
    const checkout = await prisma.itemCheckout.findUnique({
      where: {
        id: checkoutId,
      },
      include: {
        tool: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!checkout) {
      return NextResponse.json({ error: "Checkout not found" }, { status: 404 })
    }

    if (checkout.status !== "PENDING_RETURN") {
      return NextResponse.json({ error: "This checkout is not pending return" }, { status: 400 })
    }

    // Update the checkout back to checked out
    const updatedCheckout = await prisma.itemCheckout.update({
      where: {
        id: checkoutId,
      },
      data: {
        status: "CHECKED_OUT",
        actualReturnDate: null,
        returnNotes: `Return rejected: ${reason}`,
      },
    })

    // Update the tool status back to checked out
    if (checkout.toolId) {
      await prisma.tool.update({
        where: {
          id: checkout.toolId,
        },
        data: {
          status: "CHECKED_OUT",
        },
      })
    }

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: checkout.userId,
        title: "Tool Return Rejected",
        message: `Your tool return for ${checkout.tool?.name || "tool"} has been rejected: ${reason}`,
        type: "TOOL_RETURN_REJECTED",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Tool return rejected",
      checkout: updatedCheckout,
    })
  } catch (error) {
    console.error("Error rejecting tool return:", error)
    return NextResponse.json({ error: "Failed to reject tool return" }, { status: 500 })
  }
}
