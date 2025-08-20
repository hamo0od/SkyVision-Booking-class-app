"use server"

import { prisma } from "@/lib/db"

export async function getTimelineBookings(selectedDate: string) {
  try {
    // Get all classrooms
    const classrooms = await prisma.classroom.findMany({
      orderBy: { name: "asc" },
    })

    // Parse the selected date
    const startOfDay = new Date(selectedDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(selectedDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Get all bookings for the selected date
    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          // Regular bookings that fall on this date
          {
            AND: [
              { startTime: { gte: startOfDay } },
              { startTime: { lte: endOfDay } },
              { NOT: { purpose: { startsWith: "BULK_BOOKING:" } } },
            ],
          },
          // Bulk bookings that include this date
          {
            AND: [{ purpose: { startsWith: "BULK_BOOKING:" } }, { purpose: { contains: selectedDate } }],
          },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            username: true,
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    })

    // Process bulk bookings to create individual booking entries for the timeline
    const processedBookings = []

    for (const booking of bookings) {
      if (booking.purpose.startsWith("BULK_BOOKING:")) {
        // Extract dates from bulk booking
        const [, datesStr] = booking.purpose.split(":", 3)
        const dates = datesStr.split(",")

        // Check if this bulk booking includes the selected date
        if (dates.includes(selectedDate)) {
          // Create a booking entry for this specific date
          const bookingStartTime = new Date(booking.startTime)
          const bookingEndTime = new Date(booking.endTime)

          // Create new start/end times for the selected date
          const dateSpecificStart = new Date(selectedDate)
          dateSpecificStart.setHours(bookingStartTime.getHours(), bookingStartTime.getMinutes(), 0, 0)

          const dateSpecificEnd = new Date(selectedDate)
          dateSpecificEnd.setHours(bookingEndTime.getHours(), bookingEndTime.getMinutes(), 0, 0)

          processedBookings.push({
            ...booking,
            startTime: dateSpecificStart,
            endTime: dateSpecificEnd,
            // Extract the actual purpose from the bulk booking format
            purpose: booking.purpose.split(":", 3)[2] || booking.purpose,
          })
        }
      } else {
        // Regular booking - add as is
        processedBookings.push(booking)
      }
    }

    return {
      bookings: processedBookings,
      classrooms,
    }
  } catch (error) {
    console.error("Failed to fetch timeline bookings:", error)
    return {
      bookings: [],
      classrooms: [],
    }
  }
}
