'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface Booking {
  id: string
  startTime: Date | string
  endTime: Date | string
  purpose: string
  status: string
  user: {
    name: string
  }
  classroom: {
    name: string
  }
}

interface Classroom {
  id: string
  name: string
  capacity: number
}

interface BookingTimelineProps {
  bookings: Booking[]
  classrooms: Classroom[]
}

export function BookingTimeline({ bookings, classrooms }: BookingTimelineProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Generate time slots from 8 AM to 6 PM
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break // Stop at 6:00 PM
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(timeString)
      }
    }
    return slots
  }

  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(':')
    const hourNum = parseInt(hour)
    const ampm = hourNum >= 12 ? 'PM' : 'AM'
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum
    return `${displayHour}:${minute} ${ampm}`
  }

  const isTimeSlotBooked = (classroomId: string, timeSlot: string) => {
    const [hour, minute] = timeSlot.split(':')
    const slotTime = new Date(selectedDate)
    slotTime.setHours(parseInt(hour), parseInt(minute), 0, 0)

    return bookings.find(booking => {
      const startTime = new Date(booking.startTime)
      const endTime = new Date(booking.endTime)
      
      return booking.classroom.id === classroomId &&
             startTime <= slotTime &&
             endTime > slotTime &&
             (booking.status === 'PENDING' || booking.status === 'APPROVED')
    })
  }

  const getBookingForSlot = (classroomId: string, timeSlot: string) => {
    return isTimeSlotBooked(classroomId, timeSlot)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(newDate)
  }

  const timeSlots = generateTimeSlots()

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Daily Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-[100px_1fr] gap-2 mb-4">
              <div className="font-medium text-sm text-gray-600">Time</div>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${classrooms.length}, 1fr)` }}>
                {classrooms.map(classroom => (
                  <div key={classroom.id} className="text-center">
                    <div className="font-medium text-sm">{classroom.name}</div>
                    <div className="text-xs text-gray-500">Cap: {classroom.capacity}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Grid */}
            <div className="space-y-1">
              {timeSlots.map(timeSlot => (
                <div key={timeSlot} className="grid grid-cols-[100px_1fr] gap-2 items-center">
                  <div className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(timeSlot)}
                  </div>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${classrooms.length}, 1fr)` }}>
                    {classrooms.map(classroom => {
                      const booking = getBookingForSlot(classroom.id, timeSlot)
                      
                      return (
                        <div key={`${classroom.id}-${timeSlot}`} className="h-12">
                          {booking ? (
                            <div className={`h-full rounded p-2 text-xs ${getStatusColor(booking.status)}`}>
                              <div className="font-medium truncate">{booking.user.name}</div>
                              <div className="truncate">{booking.purpose}</div>
                            </div>
                          ) : (
                            <div className="h-full rounded border-2 border-dashed border-gray-200 bg-green-50 flex items-center justify-center">
                              <span className="text-xs text-green-600 font-medium">Available</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-50 border-2 border-dashed border-gray-200"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
                <span>Approved</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
