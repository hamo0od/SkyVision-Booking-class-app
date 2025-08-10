"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Users, MapPin } from "lucide-react"
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

export function HorizontalBookingTimeline() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [timelineData, setTimelineData] = useState<TimelineData>({ bookings: [], classrooms: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTimelineData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Generate time slots from 7:00 to 23:00 (11 PM) in 30-minute intervals
  const generateTimeSlots = () => {
    const slots: string[] = []
    const startHour = 7
    const endHour = 23
    for (let hour = startHour; hour <= endHour; hour++) {
      const minutes = hour === endHour ? [0] : [0, 30]
      for (const minute of minutes) {
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
            {"Daily Schedule (7 AM - 11 PM)"}
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
        {/* Horizontal Timeline */}
        <div className="mb-4">
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {timeSlots.map((timeSlot) => {
                const isHourStart = timeSlot.endsWith(":00")
                return (
                  <div key={`header-${timeSlot}`} className="min-w-[80px] sm:min-w-[100px] text-center">
                    {isHourStart ? (
                      <div className="text-xs font-medium text-gray-700 py-1 border-b border-gray-200">{timeSlot}</div>
                    ) : (
                      <div className="text-xs text-gray-400 py-1 border-b border-gray-100">{timeSlot}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Classroom Rows */}
        <div className="space-y-4">
          {timelineData.classrooms.map((classroom) => (
            <div key={classroom.id} className="bg-white rounded-lg border border-gray-200 p-4">
              {/* Classroom Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">{classroom.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {classroom.capacity}
                  </Badge>
                </div>
              </div>

              {/* Time Slots - Horizontal Scroll */}
              <div className="overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {timeSlots.map((timeSlot) => {
                    const booking = getBookingForSlot(classroom.id, timeSlot)

                    if (booking) {
                      const startTime = new Date(booking.startTime)
                      const endTime = new Date(booking.endTime)
                      const isStartSlot = timeSlot === startTime.toTimeString().slice(0, 5)

                      return (
                        <div
                          key={timeSlot}
                          className={`relative min-w-[80px] sm:min-w-[100px] h-16 sm:h-20 p-2 rounded border-2 ${getStatusColor(
                            booking.status,
                          )} ${isStartSlot ? "border-l-4 border-l-blue-500" : ""}`}
                        >
                          {isStartSlot && (
                            <div className="text-xs space-y-1">
                              <div className="font-medium truncate">{booking.user.name || booking.user.username}</div>
                              <div className="text-gray-600 truncate">
                                {startTime.toTimeString().slice(0, 5)} - {endTime.toTimeString().slice(0, 5)}
                              </div>
                              <div className="hidden sm:block truncate">{booking.purpose}</div>
                              <Badge className={`text-xs ${getStatusColor(booking.status)}`}>{booking.status}</Badge>
                            </div>
                          )}
                        </div>
                      )
                    }

                    return (
                      <div
                        key={timeSlot}
                        className="relative min-w-[80px] sm:min-w-[100px] h-16 sm:h-20 p-2 rounded border border-gray-200 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-center h-full">
                          <div className="text-xs text-green-600 text-center">
                            <span className="hidden sm:inline">Available</span>
                            <span className="sm:hidden">Free</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Legend:</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-gray-200 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span>Pending Approval</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span>Approved/Booked</span>
            </div>
          </div>
        </div>

        {timelineData.bookings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-base">No bookings for this date</p>
            <p className="text-sm">All time slots are available!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
