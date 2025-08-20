"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function getTimelineBookings(date: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new Error("Unauthorized")
  }

  try {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Get regular bookings for the specific date
    const regularBookings = await prisma.booking.findMany({
      where: {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: ["PENDING", "APPROVED"] },
        NOT: {
          purpose: {
            startsWith: "BULK_BOOKING:",
          },
        },
      },
      include: {
        classroom: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    })

    // Get bulk bookings that include this date
    const bulkBookings = await prisma.booking.findMany({
      where: {
        purpose: {
          startsWith: "BULK_BOOKING:",
        },
        status: { in: ["PENDING", "APPROVED"] },
      },
      include: {
        classroom: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Process bulk bookings to extract individual date entries
    const bulkBookingEntries = []
    for (const bulkBooking of bulkBookings) {
      const parts = bulkBooking.purpose.split(":", 3)
      if (parts.length === 3) {
        const dates = parts[1].split(",")
        const actualPurpose = parts[2]

        // Check if the requested date is in this bulk booking
        if (dates.includes(date)) {
          // Create a booking entry for this specific date
          const bookingStartTime = new Date(`${date}T${bulkBooking.startTime.toTimeString().split(" ")[0]}`)
          const bookingEndTime = new Date(`${date}T${bulkBooking.endTime.toTimeString().split(" ")[0]}`)

          bulkBookingEntries.push({
            ...bulkBooking,
            startTime: bookingStartTime,
            endTime: bookingEndTime,
            purpose: actualPurpose,
            originalPurpose: bulkBooking.purpose, // Keep original for reference
          })
        }
      }
    }

    // Combine regular bookings and bulk booking entries
    const allBookings = [...regularBookings, ...bulkBookingEntries]

    // Sort by start time
    allBookings.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    return allBookings
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to fetch timeline bookings")
  }
}
