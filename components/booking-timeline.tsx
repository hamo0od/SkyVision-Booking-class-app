"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ChevronLeft, ChevronRight, Users, MapPin } from "lucide-react"
import { getTimelineBookings } from "@/app/actions/timeline"

interface Booking {
  id: string
  startTime: Date
  endTime: Date
  purpose: string
  status: string
  classroom: {
    id: string
    name: string
    capacity: number
  }
  user: {
    name: string | null
    username: string
  }
}

interface Classroom {
  id: string
  name: string
  capacity: number
  description: string | null
}

interface TimelineData {
  bookings: Booking[]
  classrooms: Classroom[]
}

export function BookingTimeline() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [timelineData, setTimelineData] = useState<TimelineData>({ bookings: [], classrooms: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTimelineData()
  }, [selectedDate])

  const loadTimelineData = async () => {
    setIsLoading(true)
    try {
      const data = await getTimelineBookings(selectedDate)
      setTimelineData(data)
    } catch (error) {
      console.error("Failed to load timeline data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate.toISOString().split("T")[0])
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  // Generate time slots from 8 AM to 5 PM (17:00)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        slots.push(time)
      }
    }
    return slots
  }

  const getBookingForSlot = (classroomId: string, timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(":").map(Number)
    const slotTime = new Date(selectedDate)
    slotTime.setHours(hours, minutes, 0, 0)

    return timelineData.bookings.find((booking) => {
      const startTime = new Date(booking.startTime)
      const endTime = new Date(booking.endTime)
      return booking.classroom.id === classroomId && slotTime >= startTime && slotTime < endTime
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const timeSlots = generateTimeSlots()

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading timeline...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calendar className="h-5 w-5 text-blue-600" />
            Daily Schedule (8 AM - 5 PM)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => changeDate(-1)} className="p-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">
              <span className="hidden sm:inline">{formatDate(selectedDate)}</span>
              <span className="sm:hidden">{formatDateShort(selectedDate)}</span>
            </span>
            <Button variant="outline" size="sm" onClick={() => changeDate(1)} className="p-2">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="overflow-x-auto">
          <div className="min-w-[600px] sm:min-w-[800px]">
            {/* Header with classroom names */}
            <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-2 mb-4">
              <div className="font-medium text-xs sm:text-sm text-gray-600 flex items-center">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Time</span>
              </div>
              <div
                className={`grid gap-2`}
                style={{ gridTemplateColumns: `repeat(${timelineData.classrooms.length}, minmax(120px, 1fr))` }}
              >
                {timelineData.classrooms.map((classroom) => (
                  <div key={classroom.id} className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="font-medium text-xs sm:text-sm text-blue-800 flex items-center justify-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{classroom.name}</span>
                    </div>
                    <div className="text-xs text-blue-600 flex items-center justify-center gap-1 mt-1">
                      <Users className="h-3 w-3" />
                      {classroom.capacity}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline grid */}
            <div className="space-y-1">
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot} className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-2">
                  <div className="text-xs sm:text-sm font-mono text-gray-600 py-2 px-1 sm:px-2 bg-gray-50 rounded border">
                    {timeSlot}
                  </div>
                  <div
                    className={`grid gap-2`}
                    style={{ gridTemplateColumns: `repeat(${timelineData.classrooms.length}, minmax(120px, 1fr))` }}
                  >
                    {timelineData.classrooms.map((classroom) => {
                      const booking = getBookingForSlot(classroom.id, timeSlot)

                      if (booking) {
                        const startTime = new Date(booking.startTime)
                        const endTime = new Date(booking.endTime)
                        const isStartSlot = timeSlot === startTime.toTimeString().slice(0, 5)

                        return (
                          <div
                            key={`${classroom.id}-${timeSlot}`}
                            className={`p-1 sm:p-2 rounded border-2 ${getStatusColor(booking.status)} ${
                              isStartSlot ? "border-l-4 border-l-blue-500" : ""
                            }`}
                          >
                            {isStartSlot && (
                              <>
                                <div className="text-xs font-medium truncate">
                                  {booking.user.name || booking.user.username}
                                </div>
                                <div className="text-xs text-gray-600 truncate">
                                  {startTime.toTimeString().slice(0, 5)} - {endTime.toTimeString().slice(0, 5)}
                                </div>
                                <div className="text-xs truncate mt-1 hidden sm:block">{booking.purpose}</div>
                                <Badge className={`text-xs mt-1 ${getStatusColor(booking.status)}`}>
                                  {booking.status}
                                </Badge>
                              </>
                            )}
                          </div>
                        )
                      }

                      return (
                        <div
                          key={`${classroom.id}-${timeSlot}`}
                          className="p-1 sm:p-2 rounded border border-gray-200 bg-white hover:bg-green-50 transition-colors"
                        >
                          <div className="text-xs text-green-600 text-center">
                            <span className="hidden sm:inline">Available</span>
                            <span className="sm:hidden">Free</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Legend:</h4>
          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white border border-gray-200 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 border border-green-200 rounded"></div>
              <span>Booked</span>
            </div>
          </div>
        </div>

        {timelineData.bookings.length === 0 && (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <Calendar className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm sm:text-base">No bookings for this date</p>
            <p className="text-xs sm:text-sm">All time slots are available!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
