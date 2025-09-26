"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, FileText, Loader2 } from "lucide-react"
import { cancelBooking } from "@/app/actions/bookings"
import { useToast } from "@/hooks/use-toast"
import { BookingDetailsModal } from "./booking-details-modal"

interface Booking {
  id: number
  date: Date
  startTime: string
  endTime: string
  purpose: string
  participants: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  department: string
  isECAA: boolean
  ecaaLicense?: string | null
  ecaaInstructor?: string | null
  attachmentPath?: string | null
  classroom: {
    name: string
    capacity: number
  }
  user: {
    name: string
    email: string
  }
  createdAt: Date
}

interface BookingListProps {
  bookings: Booking[]
  showUserInfo?: boolean
}

// Helper functions for status checking
const isPending = (status: string) => status.toUpperCase() === "PENDING"
const isApproved = (status: string) => status.toUpperCase() === "APPROVED"
const isRejected = (status: string) => status.toUpperCase() === "REJECTED"

// Helper function to extract course title from bulk booking purpose
const extractCourseTitle = (purpose: string) => {
  if (purpose.includes("BULK_BOOKING:")) {
    const parts = purpose.split("\n")
    return parts.length > 1 ? parts[1] : "Bulk Booking"
  }
  return purpose
}

// Helper function to check if booking is bulk
const isBulkBooking = (purpose: string) => purpose.includes("BULK_BOOKING:")

// Helper function to extract bulk dates
const extractBulkDates = (purpose: string) => {
  if (!isBulkBooking(purpose)) return []

  const match = purpose.match(/BULK_BOOKING:(.+?)(?:\n|$)/)
  if (match) {
    return match[1].split(",").map((date) => date.trim())
  }
  return []
}

export function BookingList({ bookings, showUserInfo = false }: BookingListProps) {
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const { toast } = useToast()

  const handleCancel = async (bookingId: number) => {
    setCancellingId(bookingId)
    try {
      const result = await cancelBooking(bookingId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Booking cancelled successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to cancel booking",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setCancellingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    if (isPending(status)) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          ⏳ PENDING
        </Badge>
      )
    } else if (isApproved(status)) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          ✓ APPROVED
        </Badge>
      )
    } else if (isRejected(status)) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          ✗ REJECTED
        </Badge>
      )
    }
    return <Badge variant="secondary">{status}</Badge>
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01 ${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No bookings found</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {bookings.map((booking) => {
          const courseTitle = extractCourseTitle(booking.purpose)
          const bulkDates = isBulkBooking(booking.purpose) ? extractBulkDates(booking.purpose) : []

          return (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">{courseTitle}</CardTitle>
                    {isBulkBooking(booking.purpose) && (
                      <Badge variant="outline" className="text-xs">
                        📅 Bulk ({bulkDates.length} dates)
                      </Badge>
                    )}
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Date and Time */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {isBulkBooking(booking.purpose) ? (
                      <span>{formatDate(booking.date)}</span>
                    ) : (
                      <span>{formatDate(booking.date)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </span>
                  </div>
                </div>

                {/* Bulk Booking Dates */}
                {isBulkBooking(booking.purpose) && bulkDates.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">📅 Bulk Booking Dates:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {bulkDates.map((date, index) => (
                        <div key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {new Date(date).toLocaleDateString()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location and Participants */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{booking.classroom.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{booking.participants} participants</span>
                  </div>
                </div>

                {/* User Info (for admin view) */}
                {showUserInfo && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <span>👤 {booking.user.name}</span>
                  </div>
                )}

                {/* Department */}
                <div className="text-sm text-gray-600">
                  <span className="font-medium">🏢 {booking.department}</span>
                </div>

                {/* ECAA Info */}
                {booking.isECAA && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    ✈️ ECAA Training
                    {booking.ecaaLicense && <div>License: {booking.ecaaLicense}</div>}
                    {booking.ecaaInstructor && <div>Instructor: {booking.ecaaInstructor}</div>}
                  </div>
                )}

                {/* Attachment */}
                {booking.attachmentPath && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>📎 Attachment included</span>
                  </div>
                )}

                {/* Submission Date */}
                <div className="text-xs text-gray-500">
                  Submitted {new Date(booking.createdAt).toLocaleDateString()}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBooking(booking)}
                    className="flex items-center gap-1"
                  >
                    👁️ Details
                  </Button>

                  {isPending(booking.status) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="flex items-center gap-1"
                    >
                      {cancellingId === booking.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
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
      </div>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </>
  )
}
