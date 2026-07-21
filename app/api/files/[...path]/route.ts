import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { readFile } from "fs/promises"
import { basename, isAbsolute, relative, resolve } from "path"

function isInsideDirectory(parent: string, child: string): boolean {
  const relativePath = relative(parent, child)
  return relativePath === "" || (!!relativePath && !relativePath.startsWith("..") && !isAbsolute(relativePath))
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const resolvedParams = await params
    const filePath = resolvedParams.path.join("/")
    const uploadsRoot = resolve(process.cwd(), "uploads")
    const fullPath = resolve(process.cwd(), ...resolvedParams.path)

    // Security check: ensure the resolved file stays in the uploads directory.
    if (!isInsideDirectory(uploadsRoot, fullPath)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ ecaaApprovalFile: filePath }, { trainingOrderFile: filePath }],
      },
      select: { userId: true },
    })

    if (!booking || (booking.userId !== user.id && user.role !== "ADMIN")) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const fileBuffer = await readFile(fullPath)
    const fileName = basename(fullPath).replace(/["\r\n]/g, "_")

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    console.error("File access error:", error)
    return new NextResponse("File not found", { status: 404 })
  }
}
