import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Check if the tool_checkouts table exists
    try {
      const checkouts = await prisma.toolCheckout.findMany({
        include: {
          tool: {
            include: {
              material: {
                select: {
                  name: true,
                  partNumber: true,
                  serialNumber: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
              department: true,
              employeeId: true,
            },
          },
        },
        orderBy: {
          checkoutDate: "desc",
        },
      })
      return NextResponse.json(checkouts)
    } catch (error) {
      // If the table doesn't exist yet, return an empty array
      console.error("Error fetching tool checkouts:", error)
      return NextResponse.json([])
    }
  } catch (error) {
    console.error("Error fetching tool checkouts:", error)
    return NextResponse.json({ error: "Failed to fetch tool checkouts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toolId, userId, checkoutDays = 7, notes } = body

    if (!toolId || !userId) {
      return NextResponse.json({ error: "Tool ID and User ID are required" }, { status: 400 })
    }

    // Check if the tool exists
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
      include: {
        material: true,
      },
    })

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 })
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if the tool is already checked out
    const existingCheckout = await prisma.toolCheckout.findFirst({
      where: {
        toolId,
        status: "CHECKED_OUT",
      },
    })

    if (existingCheckout) {
      return NextResponse.json({ error: "Tool is already checked out" }, { status: 400 })
    }

    // Calculate due date
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + Number(checkoutDays))

    // Create the checkout
    const checkout = await prisma.toolCheckout.create({
      data: {
        toolId,
        userId,
        dueDate,
        notes,
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

    return NextResponse.json({ checkout }, { status: 201 })
  } catch (error) {
    console.error("Error creating tool checkout:", error)
    return NextResponse.json({ error: "Failed to checkout tool" }, { status: 500 })
  }
}
