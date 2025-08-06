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

    const toolId = params.id
    const { condition, notes } = await request.json()

    // Find the active checkout for this tool
    const activeCheckout = await prisma.itemCheckout.findFirst({
      where: {
        toolId: toolId,
        status: {
          in: ["CHECKED_OUT", "OVERDUE"],
        },
        userId: session.user.id,
      },
    })

    if (!activeCheckout) {
      return NextResponse.json({ error: "No active checkout found for this tool" }, { status: 404 })
    }

    // Update the checkout to pending return
    const updatedCheckout = await prisma.itemCheckout.update({
      where: {
        id: activeCheckout.id,
      },
      data: {
        status: "PENDING_RETURN",
        actualReturnDate: new Date(),
        returnNotes: notes,
        condition: condition,
      },
    })

    // Update the tool status to pending return
    await prisma.tool.update({
      where: {
        id: toolId,
      },
      data: {
        status: "PENDING_RETURN",
      },
    })

    // Create a notification for storekeepers
    const storekeepers = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "STOREKEEPER"],
        },
      },
      select: {
        id: true,
      },
    })

    // Create notifications for all storekeepers
    await Promise.all(
      storekeepers.map((storekeeper) =>
        prisma.notification.create({
          data: {
            userId: storekeeper.id,
            title: "Tool Return Request",
            message: `${session.user.name} has requested to return tool ${activeCheckout.checkoutNumber}`,
            type: "TOOL_RETURN",
          },
        }),
      ),
    )

    return NextResponse.json({
      success: true,
      message: "Tool check-in request submitted successfully",
      checkout: updatedCheckout,
    })
  } catch (error) {
    console.error("Error submitting tool check-in request:", error)
    return NextResponse.json({ error: "Failed to submit tool check-in request" }, { status: 500 })
  }
}
