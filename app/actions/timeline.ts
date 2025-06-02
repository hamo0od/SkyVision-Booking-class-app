"use server"

import { prisma } from "@/lib/db"

export async function getTimelineBookings(date?: string) {
  const targetDate = date ? new Date(date) : new Date()

  // Get start and end of the selected day
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ["PENDING", "APPROVED"] },
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        classroom: true,
        user: {
          select: {
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    })

    const classrooms = await prisma.classroom.findMany({
      orderBy: {
        name: "asc",
      },
    })

    return { bookings, classrooms }
  } catch (error) {
    console.error("Error fetching timeline data:", error)
    throw new Error("Failed to fetch timeline data")
  }
}
