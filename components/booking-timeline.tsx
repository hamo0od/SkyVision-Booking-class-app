'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react'

interface Booking {
  id: string
  startTime: string
  endTime: string
  user: {
    name: string
  }
  courseTitle: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

interface Classroom {
  id: string
  name: string
  capacity: number
}

interface BookingTimelineProps {
  classrooms: Classroom[]
  bookings: Booking[]
}

export function BookingTimeline({ classrooms, bookings }: BookingTimelineProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setSelectedDate(newDate)
  }

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) break // Stop at 5:00 PM
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const displayTime = new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
        
        slots.push({ value: timeString, display: displayTime })
      }
    }
    return slots
  }

  const getBookingForSlot = (classroomId: string, timeSlot: string) => {
    const selectedDateStr = formatDate(selectedDate)
    
    return bookings.find(booking => {
      const bookingDate = booking.startTime.split('T')[0]
      if (bookingDate !== selectedDateStr) return false
      
      const bookingStart = new Date(booking.startTime)
      const bookingEnd = new Date(booking.endTime)
      const slotTime = new Date(`${selectedDateStr}T${timeSlot}:00`)
      
      return slotTime >= bookingStart && slotTime < bookingEnd
    })
  }

  const isBookingStart = (booking: Booking, timeSlot: string) => {
    const bookingStart = new Date(booking.startTime)
    const slotTime = new Date(`${formatDate(selectedDate)}T${timeSlot}:00`)
    
    return Math.abs(bookingStart.getTime() - slotTime.getTime()) < 30 * 60 * 1000 // Within 30 minutes
  }

  const getSlotStatus = (classroomId: string, timeSlot: string) => {
    const booking = getBookingForSlot(classroomId, timeSlot)
    
    if (!booking) {
      return { status: 'available', booking: null }
    }
    
    return { status: booking.status.toLowerCase(), booking }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const timeSlots = generateTimeSlots()

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Daily Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold px-4">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-sm">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span className="text-sm">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span className="text-sm">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-sm">Rejected</span>
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header */}
            <div className="grid grid-cols-[120px_repeat(auto-fit,minmax(150px,1fr))] gap-2 mb-4">
              <div className="font-semibold text-gray-600 p-2">Time</div>
              {classrooms.map(classroom => (
                <div key={classroom.id} className="text-center">
                  <div className="font-semibold text-gray-800 flex items-center justify-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {classroom.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    Capacity: {classroom.capacity}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="space-y-1">
              {timeSlots.map(slot => (
                <div key={slot.value} className="grid grid-cols-[120px_repeat(auto-fit,minmax(150px,1fr))] gap-2">
                  <div className="p-2 text-sm font-medium text-gray-600 border-r">
                    {slot.display}
                  </div>
                  {classrooms.map(classroom => {
                    const { status, booking } = getSlotStatus(classroom.id, slot.value)
                    const isStart = booking && isBookingStart(booking, slot.value)
                    
                    return (
                      <div
                        key={`${classroom.id}-${slot.value}`}
                        className={`p-2 text-xs border rounded ${getStatusColor(status)} min-h-[40px] flex items-center justify-center`}
                      >
                        {booking ? (
                          isStart ? (
                            <div className="text-center">
                              <div className="font-medium">{booking.user.name}</div>
                              <div className="truncate">{booking.courseTitle}</div>
                            </div>
                          ) : (
                            <div className="text-center opacity-60">
                              •••
                            </div>
                          )
                        ) : (
                          <span className="text-center">Available</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
