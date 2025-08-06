import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Use string literals instead of enum values to avoid the type error
    const pendingReturns = await prisma.itemCheckout.findMany({
      where: {
        status: "PENDING_RETURN", // Use string literal instead of enum
        toolId: { not: null },
      },
      include: {
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
      },
      orderBy: {
        actualReturnDate: "desc",
      },
    })

    return NextResponse.json(pendingReturns)
  } catch (error) {
    console.error("Error fetching pending returns:", error)

    // Return empty array instead of error to prevent UI from breaking
    return NextResponse.json([])
  }
}
