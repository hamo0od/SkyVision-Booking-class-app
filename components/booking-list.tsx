"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users, FileText, Loader2 } from "lucide-react"
import { BookingDetailsModal } from "./booking-details-modal"
import { cancelBooking } from "@/app/actions/bookings"
import { useToast } from "@/hooks/use-toast"

interface Booking {
  id: number
  date: Date
  startTime: string
  endTime: string
  purpose: string
  participants: number
  department: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  filePath?: string | null
  classroom: {
    id: number
    name: string
  }
  user: {
    id: number
    name: string
    email: string
  }
}

interface BookingListProps {
  bookings: Booking[]
  showUserInfo?: boolean
}

// Helper function to check if booking is pending (case insensitive)
function isPending(status: string): boolean {
  return status.toUpperCase() === "PENDING"
}

// Helper function to get status badge variant
function getStatusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "default"
    case "PENDING":
      return "secondary"
    case "REJECTED":
      return "destructive"
    default:
      return "secondary"
  }
}

// Helper function to format status display
function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

// Helper function to extract course title from bulk booking purpose
function extractCourseTitle(purpose: string): string {
  if (purpose.startsWith("BULK_BOOKING:")) {
    // Extract the actual course title after the dates
    const match = purpose.match(/BULK_BOOKING:[^\s]+\s+(.+)/)
    return match ? match[1] : purpose
  }
  return purpose
}

// Helper function to check if booking is bulk
function isBulkBooking(purpose: string): boolean {
  return purpose.startsWith("BULK_BOOKING:")
}

// Helper function to extract bulk dates
function extractBulkDates(purpose: string): string[] {
  if (!purpose.startsWith("BULK_BOOKING:")) return []

  const match = purpose.match(/BULK_BOOKING:([^\s]+)/)
  if (!match) return []

  return match[1].split(",").map((date) => {
    // Convert from YYYY-MM-DD to readable format
    const [year, month, day] = date.split("-")
    return `${month}/${day}/${year}`
  })
}

export function BookingList({ bookings, showUserInfo = false }: BookingListProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const { toast } = useToast()

  const handleCancelBooking = async (bookingId: number) => {
    setCancellingId(bookingId)
    try {
      await cancelBooking(bookingId)
      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel booking",
        variant: "destructive",
      })
    } finally {
      setCancellingId(null)
    }
  }

  if (bookings.length === 0) {
    return <div className="text-center py-8 text-gray-500">No bookings found.</div>
  }

  return (
    <>
      <div className="space-y-4">
        {bookings.map((booking) => {
          const isBookingPending = isPending(booking.status)
          const bulkDates = isBulkBooking(booking.purpose) ? extractBulkDates(booking.purpose) : []
          const courseTitle = extractCourseTitle(booking.purpose)

          return (
            <Card key={booking.id} className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">{courseTitle}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {booking.classroom.name}
                        {isBulkBooking(booking.purpose) && (
                          <Badge variant="outline" className="ml-2">
                            Bulk ({bulkDates.length} dates)
                          </Badge>
                        )}
                      </div>
                      {showUserInfo && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {booking.user.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(booking.status)}>{formatStatus(booking.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Department */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    {booking.department}
                  </div>

                  {/* Date and Time */}
                  {isBulkBooking(booking.purpose) ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Bulk Booking Dates:</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {bulkDates.map((date, index) => (
                          <div key={index} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            {date}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {booking.startTime} - {booking.endTime}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {booking.date.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {booking.startTime} - {booking.endTime}
                      </div>
                    </div>
                  )}

                  {/* Participants */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    {booking.participants} participants
                  </div>

                  {/* Action Buttons */}
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

                    {isBookingPending && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="flex items-center gap-2"
                      >
                        {cancellingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : null}
                        {cancellingId === booking.id ? "Cancelling..." : "Cancel"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
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
