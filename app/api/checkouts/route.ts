import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // 'material' or 'tool' or 'all'
    const status = searchParams.get("status")

    const whereClause: any = {}

    if (type === "material") {
      whereClause.materialId = { not: null }
    } else if (type === "tool") {
      whereClause.toolId = { not: null }
    }

    if (status) {
      whereClause.status = status
    }

    const checkouts = await prisma.itemCheckout.findMany({
      where: whereClause,
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
            employeeId: true,
          },
        },
        issuedBy: {
          select: {
            name: true,
          },
        },
        returnedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        checkoutDate: "desc",
      },
    })

    // Update overdue status
    const now = new Date()
    const overdueCheckouts = checkouts.filter(
      (checkout) =>
        checkout.status === "CHECKED_OUT" && checkout.expectedReturnDate && checkout.expectedReturnDate < now,
    )

    if (overdueCheckouts.length > 0) {
      await prisma.itemCheckout.updateMany({
        where: {
          id: {
            in: overdueCheckouts.map((c) => c.id),
          },
        },
        data: {
          status: "OVERDUE",
        },
      })
    }

    return NextResponse.json(checkouts)
  } catch (error) {
    console.error("Error fetching checkouts:", error)
    return NextResponse.json({ error: "Failed to fetch checkouts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      materialId,
      toolId,
      userId,
      quantity = 1,
      purpose,
      expectedReturnDays,
      priority = "NORMAL",
      notes,
      issuedById,
    } = body

    // Validate that either materialId or toolId is provided, but not both
    if ((!materialId && !toolId) || (materialId && toolId)) {
      return NextResponse.json({ error: "Either materialId or toolId must be provided, but not both" }, { status: 400 })
    }

    // Generate checkout number
    const checkoutCount = await prisma.itemCheckout.count()
    const checkoutNumber = `CHK${String(checkoutCount + 1).padStart(6, "0")}`

    // Calculate expected return date
    let expectedReturnDate = null
    if (expectedReturnDays) {
      expectedReturnDate = new Date()
      expectedReturnDate.setDate(expectedReturnDate.getDate() + Number.parseInt(expectedReturnDays))
    }

    // If checking out a tool, verify it's available
    if (toolId) {
      const tool = await prisma.tool.findUnique({
        where: { id: toolId },
        include: {
          checkouts: {
            where: {
              status: {
                in: ["CHECKED_OUT", "OVERDUE"],
              },
            },
          },
        },
      })

      if (!tool) {
        return NextResponse.json({ error: "Tool not found" }, { status: 404 })
      }

      if (tool.checkouts.length > 0) {
        return NextResponse.json({ error: "Tool is already checked out" }, { status: 400 })
      }

      // Update tool status
      await prisma.tool.update({
        where: { id: toolId },
        data: { status: "CHECKED_OUT" },
      })
    }

    // If checking out material, verify sufficient stock
    if (materialId) {
      const material = await prisma.material.findUnique({
        where: { id: materialId },
      })

      if (!material) {
        return NextResponse.json({ error: "Material not found" }, { status: 404 })
      }

      if (material.stockQty < quantity) {
        return NextResponse.json({ error: "Insufficient stock available" }, { status: 400 })
      }

      // Update material stock if it's consumable
      if (material.isConsumable) {
        await prisma.material.update({
          where: { id: materialId },
          data: {
            stockQty: {
              decrement: quantity,
            },
          },
        })

        // Create stock movement record
        await prisma.stockMovement.create({
          data: {
            materialId,
            type: "CHECKOUT",
            quantity: -quantity,
            previousStock: material.stockQty,
            newStock: material.stockQty - quantity,
            performedById: issuedById || userId,
            notes: `Checked out to ${userId} - ${purpose}`,
          },
        })
      }
    }

    // Create checkout record
    const checkout = await prisma.itemCheckout.create({
      data: {
        checkoutNumber,
        materialId,
        toolId,
        userId,
        quantity,
        purpose,
        expectedReturnDate,
        priority,
        notes,
        issuedById,
        issuedDate: issuedById ? new Date() : null,
        status: issuedById ? "CHECKED_OUT" : "PENDING",
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
        issuedBy: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(checkout, { status: 201 })
  } catch (error) {
    console.error("Error creating checkout:", error)
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 })
  }
}
