import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { readFile } from "fs/promises"
import { join } from "path"

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Await the params as required by Next.js 15
    const resolvedParams = await params
    const filePath = resolvedParams.path.join("/")
    const fullPath = join(process.cwd(), filePath)

    // Security check: ensure the file is in the uploads directory
    if (!fullPath.includes(join(process.cwd(), "uploads"))) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const fileBuffer = await readFile(fullPath)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${resolvedParams.path[resolvedParams.path.length - 1]}"`,
      },
    })
  } catch (error) {
    console.error("File access error:", error)
    return new NextResponse("File not found", { status: 404 })
  }
}
