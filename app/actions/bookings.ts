"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createBooking(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const classroomId = formData.get("classroomId") as string
  const startTime = new Date(formData.get("startTime") as string)
  const endTime = new Date(formData.get("endTime") as string)
  const purpose = formData.get("purpose") as string

  // Check for conflicts
  const conflict = await prisma.booking.findFirst({
    where: {
      classroomId,
      status: { in: ["PENDING", "APPROVED"] },
      OR: [
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime },
        },
      ],
    },
  })

  if (conflict) {
    throw new Error("Time slot conflicts with existing booking")
  }

  await prisma.booking.create({
    data: {
      userId: session.user.id,
      classroomId,
      startTime,
      endTime,
      purpose,
    },
  })

  revalidatePath("/dashboard")
}

export async function updateBookingStatus(bookingId: string, status: "APPROVED" | "REJECTED") {
  const session = await getServerSession(authOptions)

  if (!session?.user?.role || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  })

  revalidatePath("/admin")
  revalidatePath("/dashboard")
}
