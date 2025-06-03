"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, X, UserCheck, Users, BookOpen } from "lucide-react"
import { cancelBooking } from "@/app/actions/bookings"
import { useState } from "react"

interface Booking {
  id: string
  startTime: Date
  endTime: Date
  purpose: string
  status: string
  instructorName?: string
  trainingOrder?: string
  participants?: number
  classroom: {
    name: string
  }
}

interface BookingListProps {
  bookings: Booking[]
}

export function BookingList({ bookings }: BookingListProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string; id: string } | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200"
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "✓"
      case "REJECTED":
        return "✗"
      default:
        return "⏳"
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm("Are you sure you want to cancel this booking request?")) {
      setIsLoading(bookingId)
      try {
        const result = await cancelBooking(bookingId)
        setMessage({
          type: "success",
          text: result.message || "Booking cancelled successfully",
          id: bookingId,
        })

        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage(null)
        }, 3000)
      } catch (error) {
        setMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Failed to cancel booking",
          id: bookingId,
        })
      } finally {
        setIsLoading(null)
      }
    }
  }

  if (bookings.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No bookings yet</p>
          <p className="text-gray-400 text-sm mt-1">Your booking requests will appear here</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card
          key={booking.id}
          className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-shadow duration-200"
        >
          {message && message.id === booking.id && (
            <div
              className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                {booking.classroom.name}
              </CardTitle>
              <Badge className={`${getStatusColor(booking.status)} font-medium`}>
                <span className="mr-1">{getStatusIcon(booking.status)}</span>
                {booking.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">
                {new Date(booking.startTime).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {new Date(booking.startTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                -{" "}
                {new Date(booking.endTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {booking.instructorName && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserCheck className="h-4 w-4" />
                <span>Instructor: {booking.instructorName}</span>
              </div>
            )}
            {booking.trainingOrder && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>Training Order: {booking.trainingOrder}</span>
              </div>
            )}
            {booking.participants && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{booking.participants} participants</span>
              </div>
            )}
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">Course: {booking.purpose}</span>
            </div>

            {/* Only show cancel button for pending bookings or future approved bookings */}
            {(booking.status === "PENDING" ||
              (booking.status === "APPROVED" && new Date(booking.startTime) > new Date())) && (
              <div className="pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleCancelBooking(booking.id)}
                  disabled={isLoading === booking.id}
                >
                  <X className="h-4 w-4 mr-1" />
                  {isLoading === booking.id ? "Cancelling..." : "Cancel Booking"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
