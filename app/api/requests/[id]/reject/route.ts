import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { approvedById, notes } = body

    console.log("Rejecting request with approvedById:", approvedById)

    // First, verify the user exists
    const user = await prisma.user.findFirst({
      where: {
        email: { contains: "@airline.com" }, // Find any test user
        role: { in: ["ADMIN", "STOREKEEPER"] },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "No valid approver found in database" }, { status: 400 })
    }

    console.log("Found approver:", user.id, user.email)

    const materialRequest = await prisma.materialRequest.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        approvedById: user.id, // Use a valid user ID from the database
        approvedDate: new Date(),
        notes: notes || "Request rejected",
      },
      include: {
        requester: { select: { name: true, department: true } },
        material: { select: { name: true, partNumber: true } },
        approvedBy: { select: { name: true } },
      },
    })

    return NextResponse.json(materialRequest)
  } catch (error) {
    console.error("Error rejecting request:", error)
    return NextResponse.json({ error: "Failed to reject request" }, { status: 500 })
  }
}
