import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // Test database connection
    const startTime = Date.now()
    const result = await prisma.$queryRaw`SELECT 1 as health, NOW() as timestamp, version() as pg_version`
    const responseTime = Date.now() - startTime

    // Get some basic stats
    const [userCount, materialCount, categoryCount, requestCount] = await Promise.all([
      prisma.user.count(),
      prisma.material.count(),
      prisma.category.count(),
      prisma.materialRequest.count(),
    ])

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        healthy: true,
        responseTime: `${responseTime}ms`,
        message: "Database connection successful",
        version: result[0].pg_version,
        stats: {
          users: userCount,
          materials: materialCount,
          categories: categoryCount,
          requests: requestCount,
        },
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"), // Hide password
      },
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
