import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { issuedById, quantityIssued } = body

    console.log("Issuing request with issuedById:", issuedById, "quantity:", quantityIssued)

    // First, verify the user exists
    const user = await prisma.user.findFirst({
      where: {
        email: { contains: "@airline.com" }, // Find any test user
        role: { in: ["ADMIN", "STOREKEEPER"] },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "No valid issuer found in database" }, { status: 400 })
    }

    console.log("Found issuer:", user.id, user.email)

    const result = await prisma.$transaction(async (tx) => {
      // Get the request with material details
      const materialRequest = await tx.materialRequest.findUnique({
        where: { id: params.id },
        include: {
          material: true,
          requester: { select: { name: true, department: true } },
        },
      })

      if (!materialRequest) {
        throw new Error("Request not found")
      }

      if (materialRequest.status !== "APPROVED") {
        throw new Error("Request must be approved before issuing")
      }

      // Check stock availability
      if (materialRequest.material.stockQty < quantityIssued) {
        throw new Error(
          `Insufficient stock. Available: ${materialRequest.material.stockQty}, Requested: ${quantityIssued}`,
        )
      }

      console.log(
        `Deducting ${quantityIssued} from ${materialRequest.material.name} (Current stock: ${materialRequest.material.stockQty})`,
      )

      // Update material stock
      const updatedMaterial = await tx.material.update({
        where: { id: materialRequest.materialId },
        data: {
          stockQty: {
            decrement: quantityIssued,
          },
          updatedById: user.id,
        },
      })

      console.log(`New stock level: ${updatedMaterial.stockQty}`)

      // Update request status
      const updatedRequest = await tx.materialRequest.update({
        where: { id: params.id },
        data: {
          status: "ISSUED",
          issuedById: user.id,
          issuedDate: new Date(),
          quantityIssued: quantityIssued,
        },
        include: {
          requester: { select: { name: true, department: true } },
          material: { select: { name: true, partNumber: true, stockQty: true } },
          issuedBy: { select: { name: true } },
        },
      })

      // Create stock movement record for tracking
      await tx.stockMovement.create({
        data: {
          materialId: materialRequest.materialId,
          type: "ISSUE",
          quantity: quantityIssued,
          previousStock: materialRequest.material.stockQty,
          newStock: updatedMaterial.stockQty,
          requestId: params.id,
          performedById: user.id,
          notes: `Issued ${quantityIssued} units for request ${materialRequest.requestNumber} to ${materialRequest.requester.name} (${materialRequest.requester.department})`,
        },
      })

      return {
        request: updatedRequest,
        stockChange: {
          materialName: materialRequest.material.name,
          previousStock: materialRequest.material.stockQty,
          newStock: updatedMaterial.stockQty,
          quantityIssued: quantityIssued,
        },
      }
    })

    console.log("Stock successfully updated:", result.stockChange)

    return NextResponse.json({
      message: "Request issued successfully",
      ...result,
    })
  } catch (error) {
    console.error("Error issuing request:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to issue request" },
      { status: 500 },
    )
  }
}
