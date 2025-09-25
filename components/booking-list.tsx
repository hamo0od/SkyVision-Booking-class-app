"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users, FileText, Loader2 } from "lucide-react"
import { cancelBooking } from "@/app/actions/bookings"
import { BookingDetailsModal } from "./booking-details-modal"

interface Booking {
  id: string
  startTime: Date
  endTime: Date
  purpose: string
  instructorName: string
  trainingOrder: string
  courseReference: string | null
  department: string
  participants: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: Date
  classroom: {
    id: string
    name: string
    capacity: number
  }
  user: {
    id: string
    name: string | null
    email: string
  }
  ecaaInstructorApproval: boolean
  ecaaApprovalNumber: string | null
  qualifications: string | null
  ecaaApprovalFile: string | null
  trainingOrderFile: string | null
  bulkBookingId: string | null
}

interface BookingListProps {
  bookings: Booking[]
  showUserInfo?: boolean
}

export function BookingList({ bookings, showUserInfo = false }: BookingListProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return
    }

    setCancellingId(bookingId)
    try {
      await cancelBooking(bookingId)
    } catch (error) {
      console.error("Failed to cancel booking:", error)
      alert("Failed to cancel booking. Please try again.")
    } finally {
      setCancellingId(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date))
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date))
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200"
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const isPending = (status: string) => {
    return status.toUpperCase() === "PENDING"
  }

  const getDisplayTitle = (booking: Booking) => {
    if (booking.purpose.startsWith("BULK_BOOKING:")) {
      // Extract the actual course title from bulk booking purpose
      const parts = booking.purpose.split(":")
      if (parts.length >= 3) {
        return parts.slice(2).join(":") // Join back in case the title contains colons
      }
    }
    return booking.purpose
  }

  const isBulkBooking = (booking: Booking) => {
    return booking.purpose.startsWith("BULK_BOOKING:")
  }

  const getBulkBookingDates = (booking: Booking) => {
    if (!isBulkBooking(booking)) return []
    const parts = booking.purpose.split(":")
    if (parts.length >= 2) {
      return parts[1].split(",")
    }
    return []
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-500 text-center">
            {showUserInfo ? "No bookings have been submitted yet." : "You haven't made any bookings yet."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                    {getDisplayTitle(booking)}
                  </CardTitle>
                  {isBulkBooking(booking) && (
                    <CardDescription className="text-sm text-blue-600 font-medium">
                      Bulk Booking ({getBulkBookingDates(booking).length} dates)
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {isPending(booking.status) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="flex items-center gap-1"
                    >
                      {cancellingId === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBooking(booking)}
                    className="flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Details
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {formatDate(booking.startTime)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  {booking.classroom.name}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  {booking.participants} participants
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={`${getStatusColor(booking.status)} border`}>{booking.status}</Badge>
                  <span className="text-sm text-gray-500">Submitted {formatDate(booking.createdAt)}</span>
                </div>
                {showUserInfo && <div className="text-sm text-gray-600">{booking.user.name || booking.user.email}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </>
  )
}
