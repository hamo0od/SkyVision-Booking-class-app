"use client"

import { updateBookingStatus, deleteBooking } from "@/app/actions/bookings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, FileText, User, Check, X, Trash2 } from "lucide-react"
import { useState } from "react"

interface Booking {
  id: string
  startTime: Date
  endTime: Date
  purpose: string
  status: string
  user: {
    name: string | null
    email: string
  }
  classroom: {
    name: string
  }
}

interface AdminBookingListProps {
  bookings: Booking[]
  showActions: boolean
}

export function AdminBookingList({ bookings, showActions }: AdminBookingListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
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

  const handleStatusUpdate = async (bookingId: string, status: "APPROVED" | "REJECTED") => {
    try {
      await updateBookingStatus(bookingId, status)
      setMessage({
        type: "success",
        text: `Booking ${status.toLowerCase()} successfully!`,
        id: bookingId,
      })

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to update booking status",
        id: bookingId,
      })
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    if (confirm("Are you sure you want to delete this booking?")) {
      setIsDeleting(bookingId)
      try {
        await deleteBooking(bookingId)
      } catch (error) {
        alert("Failed to delete booking")
        setIsDeleting(null)
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
          <p className="text-gray-500 text-lg">No bookings found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card
          key={booking.id}
          className={`shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-shadow duration-200 ${
            isDeleting === booking.id ? "opacity-50 pointer-events-none" : ""
          }`}
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
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span className="font-medium">{booking.user.name || booking.user.email}</span>
            </div>

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

            <div className="flex items-start gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-3">{booking.purpose}</span>
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              {showActions && booking.status === "PENDING" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(booking.id, "APPROVED")}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleStatusUpdate(booking.id, "REJECTED")}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={() => handleDeleteBooking(booking.id)} className="flex-1">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
