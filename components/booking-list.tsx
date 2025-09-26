"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookingDetailsModal } from "./booking-details-modal"
import { cancelBooking } from "@/app/actions/bookings"
import { Calendar, Clock, MapPin, Users, FileText, Trash2, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  ecaaInstructorApproval: boolean
  ecaaApprovalNumber: string | null
  qualifications: string | null
  ecaaApprovalFile: string | null
  trainingOrderFile: string | null
  bulkBookingId: string | null
  createdAt: Date
  classroom: {
    id: string
    name: string
    capacity: number
    location: string
  }
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface BookingListProps {
  bookings: Booking[]
  showUserInfo?: boolean
}

export function BookingList({ bookings, showUserInfo = false }: BookingListProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isTransitionPending, startTransition] = useTransition()
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const { toast } = useToast()

  const isBookingPending = (status: string): boolean => {
    return status.toUpperCase() === "PENDING"
  }

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId)
    startTransition(async () => {
      try {
        const result = await cancelBooking(bookingId)
        if (result.success) {
          toast({
            title: "Success",
            description: result.message || "Booking cancelled successfully",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to cancel booking",
          variant: "destructive",
        })
      } finally {
        setCancellingId(null)
      }
    })
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

  const formatDate = (date: Date) => {
    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) {
        return "Invalid Date"
      }
      return dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      console.error("Date formatting error:", error)
      return "Invalid Date"
    }
  }

  const formatTime = (date: Date) => {
    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) {
        return "Invalid Time"
      }
      return dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Time formatting error:", error)
      return "Invalid Time"
    }
  }

  const extractBulkBookingInfo = (booking: Booking) => {
    if (!booking.purpose.startsWith("BULK_BOOKING:")) {
      return { isBulk: false, dates: [], courseTitle: booking.purpose }
    }

    const parts = booking.purpose.split(":")
    if (parts.length < 3) {
      return { isBulk: true, dates: [], courseTitle: booking.purpose }
    }

    const dates = parts[1].split(",")
    const courseTitle = parts.slice(2).join(":")

    return { isBulk: true, dates, courseTitle }
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-500 text-center">You haven't made any classroom bookings yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {bookings.map((booking) => {
          const bulkInfo = extractBulkBookingInfo(booking)
          const isCancelling = cancellingId === booking.id
          const isBookingPendingCheck = isBookingPending(booking.status)

          return (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Title and Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {bulkInfo.isBulk ? bulkInfo.courseTitle : booking.purpose}
                      </h3>
                      <div className="flex items-center gap-2">
                        {bulkInfo.isBulk && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Bulk ({bulkInfo.dates.length} dates)
                          </Badge>
                        )}
                        <Badge className={getStatusColor(booking.status)}>{booking.status.toUpperCase()}</Badge>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {bulkInfo.isBulk ? "Multiple Dates" : formatDate(booking.startTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{booking.classroom.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{booking.participants} participants</span>
                      </div>
                    </div>

                    {/* Bulk Booking Dates */}
                    {bulkInfo.isBulk && bulkInfo.dates.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Bulk Booking Dates:</p>
                        <div className="flex flex-wrap gap-2">
                          {bulkInfo.dates.slice(0, 6).map((dateStr, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {new Date(dateStr).toLocaleDateString()}
                            </Badge>
                          ))}
                          {bulkInfo.dates.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{bulkInfo.dates.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FileText className="h-4 w-4" />
                      <span className="truncate">Submitted {new Date(booking.createdAt).toLocaleDateString()}</span>
                    </div>

                    {showUserInfo && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Requested by:</span> {booking.user.name || booking.user.email}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBooking(booking)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Details
                    </Button>

                    {isBookingPendingCheck && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={isCancelling || isTransitionPending}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {isCancelling ? "Cancelling..." : "Cancel"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && <BookingDetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
    </>
  )
}
