"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookingDetailsModal } from "./booking-details-modal"
import { cancelBooking } from "@/app/actions/bookings"
import { Calendar, Clock, MapPin, Users, FileText, Loader2 } from "lucide-react"

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
  const [cancellingBookings, setCancellingBookings] = useState<Set<string>>(new Set())

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return
    }

    setCancellingBookings((prev) => new Set(prev).add(bookingId))

    try {
      const result = await cancelBooking(bookingId)
      if (result.success) {
        // The booking will be removed from the list via revalidation
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to cancel booking")
    } finally {
      setCancellingBookings((prev) => {
        const newSet = new Set(prev)
        newSet.delete(bookingId)
        return newSet
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase()
    switch (statusUpper) {
      case "PENDING":
        return <Badge variant="secondary">⏳ Pending</Badge>
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            ✅ Approved
          </Badge>
        )
      case "REJECTED":
        return <Badge variant="destructive">❌ Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const isPending = (status: string) => {
    return status.toUpperCase() === "PENDING"
  }

  const formatBulkBookingTitle = (purpose: string) => {
    if (purpose.startsWith("BULK_BOOKING:")) {
      const parts = purpose.split(":")
      if (parts.length >= 3) {
        const dates = parts[1].split(",")
        const actualPurpose = parts.slice(2).join(":")
        return {
          title: actualPurpose,
          isBulk: true,
          dateCount: dates.length,
          dates: dates,
        }
      }
    }
    return {
      title: purpose,
      isBulk: false,
      dateCount: 0,
      dates: [],
    }
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-500 text-center">
            {showUserInfo ? "No bookings have been submitted yet." : "You haven't made any bookings yet."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const bookingInfo = formatBulkBookingTitle(booking.purpose)
        const isCancelling = cancellingBookings.has(booking.id)

        return (
          <Card key={booking.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg leading-tight">
                    {bookingInfo.title}
                    {bookingInfo.isBulk && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        📅 Bulk ({bookingInfo.dateCount} dates)
                      </Badge>
                    )}
                  </CardTitle>
                  {showUserInfo && (
                    <CardDescription className="flex items-center gap-2">
                      <span>👤 {booking.user.name || booking.user.email}</span>
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">{getStatusBadge(booking.status)}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>
                    {bookingInfo.isBulk
                      ? `${bookingInfo.dateCount} dates selected`
                      : booking.startTime.toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>
                    {booking.startTime.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                    -{" "}
                    {booking.endTime.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{booking.classroom.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{booking.participants} participants</span>
                </div>
              </div>

              {bookingInfo.isBulk && bookingInfo.dates.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-800 mb-2">📅 Bulk Booking Dates:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {bookingInfo.dates.map((dateStr, index) => (
                      <div key={index} className="text-xs bg-white px-2 py-1 rounded border border-blue-300">
                        {new Date(dateStr).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">📋 Course Details</div>
                <div className="text-sm">
                  <div>
                    <strong>Instructor:</strong> {booking.instructorName}
                  </div>
                  <div>
                    <strong>Department:</strong> {booking.department}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Submitted{" "}
                    {booking.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBooking(booking)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Details
                </Button>
                {isPending(booking.status) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={isCancelling}
                    className="flex items-center gap-2"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>❌ Cancel</>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  )
}
