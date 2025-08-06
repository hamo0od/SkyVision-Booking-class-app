'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function createBooking(formData: FormData) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    throw new Error('You must be logged in to create a booking')
  }

  // Get the user from the database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    throw new Error('User not found')
  }

  const classroomId = formData.get('classroomId') as string
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const purpose = formData.get('purpose') as string
  const instructorName = formData.get('instructorName') as string
  const trainingOrder = formData.get('trainingOrder') as string
  const participants = parseInt(formData.get('participants') as string)
  const ecaaApproval = formData.get('ecaaApproval') === 'true'
  const approvalNumber = formData.get('approvalNumber') as string
  const qualifications = formData.get('qualifications') as string

  // Validate required fields
  if (!classroomId || !startTime || !endTime || !purpose || !instructorName || !trainingOrder || !participants) {
    throw new Error('All fields are required')
  }

  // Validate dates
  const startTimeDate = new Date(startTime)
  const endTimeDate = new Date(endTime)

  if (isNaN(startTimeDate.getTime()) || isNaN(endTimeDate.getTime())) {
    throw new Error('Invalid date or time selected')
  }

  if (startTimeDate >= endTimeDate) {
    throw new Error('End time must be after start time')
  }

  // Check if duration exceeds 2.5 hours (150 minutes)
  const durationMinutes = (endTimeDate.getTime() - startTimeDate.getTime()) / (1000 * 60)
  if (durationMinutes > 150) {
    throw new Error('Booking duration cannot exceed 2.5 hours')
  }

  // Check for conflicts
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      classroomId,
      status: {
        in: ['PENDING', 'APPROVED']
      },
      OR: [
        {
          startTime: {
            lte: startTimeDate
          },
          endTime: {
            gt: startTimeDate
          }
        },
        {
          startTime: {
            lt: endTimeDate
          },
          endTime: {
            gte: endTimeDate
          }
        },
        {
          startTime: {
            gte: startTimeDate
          },
          endTime: {
            lte: endTimeDate
          }
        }
      ]
    }
  })

  if (conflictingBooking) {
    throw new Error('This time slot is already booked or has a pending request')
  }

  try {
    await prisma.booking.create({
      data: {
        userId: user.id,
        classroomId,
        startTime: startTimeDate,
        endTime: endTimeDate,
        purpose,
        instructorName,
        trainingOrder,
        participants,
        ecaaApproval,
        approvalNumber: ecaaApproval ? approvalNumber : null,
        qualifications: !ecaaApproval ? qualifications : null,
        status: 'PENDING'
      }
    })

    revalidatePath('/dashboard')
    return { success: true, message: 'Booking request created successfully!' }
  } catch (error) {
    console.error('Database error:', error)
    throw new Error('Failed to create booking. Please try again.')
  }
}

export async function cancelBooking(bookingId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    throw new Error('You must be logged in to cancel a booking')
  }

  // Get the user from the database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Check if the booking exists and belongs to the user
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId: user.id
    }
  })

  if (!booking) {
    throw new Error('Booking not found or you do not have permission to cancel it')
  }

  // Check if booking can be cancelled (not already started)
  if (new Date(booking.startTime) <= new Date()) {
    throw new Error('Cannot cancel a booking that has already started')
  }

  try {
    await prisma.booking.delete({
      where: {
        id: bookingId
      }
    })

    revalidatePath('/dashboard')
    return { success: true, message: 'Booking cancelled successfully!' }
  } catch (error) {
    console.error('Database error:', error)
    throw new Error('Failed to cancel booking. Please try again.')
  }
}

export async function approveBooking(bookingId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    throw new Error('You must be logged in')
  }

  // Get the user from the database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user || user.role !== 'ADMIN') {
    throw new Error('Only admins can approve bookings')
  }

  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'APPROVED' }
    })

    revalidatePath('/admin')
    return { success: true, message: 'Booking approved successfully!' }
  } catch (error) {
    console.error('Database error:', error)
    throw new Error('Failed to approve booking. Please try again.')
  }
}

export async function rejectBooking(bookingId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    throw new Error('You must be logged in')
  }

  // Get the user from the database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user || user.role !== 'ADMIN') {
    throw new Error('Only admins can reject bookings')
  }

  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'REJECTED' }
    })

    revalidatePath('/admin')
    return { success: true, message: 'Booking rejected successfully!' }
  } catch (error) {
    console.error('Database error:', error)
    throw new Error('Failed to reject booking. Please try again.')
  }
}

export async function deleteBooking(bookingId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    throw new Error('You must be logged in')
  }

  // Get the user from the database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user || user.role !== 'ADMIN') {
    throw new Error('Only admins can delete bookings')
  }

  try {
    await prisma.booking.delete({
      where: { id: bookingId }
    })

    revalidatePath('/admin')
    return { success: true, message: 'Booking deleted successfully!' }
  } catch (error) {
    console.error('Database error:', error)
    throw new Error('Failed to delete booking. Please try again.')
  }
}
