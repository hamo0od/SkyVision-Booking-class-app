"use server"

import { prisma } from "@/lib/db"

const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/

function parseDateKeyLocal(dateKey: string): Date | null {
  if (!DATE_KEY_REGEX.test(dateKey)) return null
  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-")
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const parsed = new Date(year, month - 1, day, 0, 0, 0, 0)

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return parsed
}

export async function getTimelineBookings(selectedDate: string) {
  try {
    const localDate = parseDateKeyLocal(selectedDate)
    if (!localDate) {
      return {
        bookings: [],
        classrooms: [],
      }
    }

    // Get all classrooms
    const classrooms = await prisma.classroom.findMany({
      orderBy: { name: "asc" },
    })

    // Parse the selected date
    const startOfDay = new Date(localDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(localDate)
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
          const dateSpecificStart = new Date(localDate)
          dateSpecificStart.setHours(bookingStartTime.getHours(), bookingStartTime.getMinutes(), 0, 0)

          const dateSpecificEnd = new Date(localDate)
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
