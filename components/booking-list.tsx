"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookingDetailsModal } from "./booking-details-modal"
import { EditBookingModal } from "./edit-booking-modal"
import { cancelBooking } from "@/app/actions/bookings"
import { Calendar, Clock, MapPin, Users, FileText, Loader2, Edit2 } from "lucide-react"

interface User {
  id: string
  name: string | null
  email: string
}

interface Classroom {
  id: string
  name: string
  capacity: number
}

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
  ecaaInstructorApproval: boolean
  ecaaApprovalNumber: string | null
  qualifications: string | null
  ecaaApprovalFile: string | null
  trainingOrderFile: string | null
  bulkBookingId: string | null
  user: User
  classroom: Classroom
}

interface BookingListProps {
  bookings: Booking[]
  showUserInfo?: boolean
  classrooms?: Classroom[]
}

export function BookingList({ bookings, showUserInfo = false, classrooms = [] }: BookingListProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [cancellingBookings, setCancellingBookings] = useState<Set<string>>(new Set())

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return
    }

    setCancellingBookings((prev) => new Set(prev).add(bookingId))

    try {
      await cancelBooking(bookingId)
      // The page will be revalidated automatically by the server action
    } catch (error) {
      console.error("Failed to cancel booking:", error)
      alert("Failed to cancel booking. Please try again.")
    } finally {
      setCancellingBookings((prev) => {
        const newSet = new Set(prev)
        newSet.delete(bookingId)
        return newSet
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            ⏳ Pending
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            ✅ Approved
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            ❌ Rejected
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const isPending = (booking: Booking) => {
    return booking.status.toUpperCase() === "PENDING"
  }

  const isBulkBooking = (booking: Booking) => {
    return booking.purpose.startsWith("BULK_BOOKING:")
  }

  const getBulkBookingDates = (purpose: string): string[] => {
    if (!purpose.startsWith("BULK_BOOKING:")) return []
    const parts = purpose.split(":")
    if (parts.length < 3) return []
    return parts[1].split(",")
  }

  const getDisplayTitle = (booking: Booking) => {
    if (isBulkBooking(booking)) {
      const parts = booking.purpose.split(":")
      return parts.length >= 3 ? parts[2] : "Bulk Booking"
    }
    return booking.purpose
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-500 text-center">
            {showUserInfo ? "No booking requests have been submitted yet." : "You haven't made any bookings yet."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {getDisplayTitle(booking)}
                </CardTitle>
                {showUserInfo && (
                  <CardDescription className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {booking.user.name || booking.user.email}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                {getStatusBadge(booking.status)}
                {isBulkBooking(booking) && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    📅 Bulk ({getBulkBookingDates(booking.purpose).length} dates)
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>{formatDate(booking.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{booking.classroom.name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>{booking.participants} participants</span>
              </div>
            </div>

            {isBulkBooking(booking) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Bulk Booking Dates:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {getBulkBookingDates(booking.purpose).map((dateStr, index) => (
                    <div key={index} className="text-xs bg-white px-2 py-1 rounded border border-blue-300">
                      {new Date(dateStr).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
              <FileText className="h-3 w-3" />
              <span>{booking.department}</span>
              <span>•</span>
              <span>Submitted {formatDate(booking.createdAt)}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBooking(booking)}
                className="flex-1 sm:flex-none"
              >
                📋 Details
              </Button>

              {isPending(booking) && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingBooking(booking)}
                    className="flex-1 sm:flex-none text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancellingBookings.has(booking.id)}
                    className="flex-1 sm:flex-none"
                  >
                    {cancellingBookings.has(booking.id) ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Cancelling...
                      </>
                    ) : (
                      "🗑️ Cancel"
                    )}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          showUserInfo={showUserInfo}
        />
      )}

      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          classrooms={classrooms}
          onSuccess={() => {
            setEditingBooking(null)
            // Page will revalidate automatically
          }}
        />
      )}
    </div>
  )
}
