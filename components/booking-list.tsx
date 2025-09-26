"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users, FileText, Trash2 } from "lucide-react"
import { BookingDetailsModal } from "./booking-details-modal"
import { cancelBooking } from "@/app/actions/bookings"
import { toast } from "sonner"

interface Booking {
  id: string
  date: Date
  startTime: string
  endTime: string
  purpose: string
  participants: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  department: string
  filePath?: string | null
  classroom: {
    id: string
    name: string
    capacity: number
  }
  user: {
    id: string
    name: string
    email: string
  }
}

interface BookingListProps {
  bookings: Booking[]
  showUserInfo?: boolean
  currentUserId?: string
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
    const match = purpose.match(/BULK_BOOKING:[^-]+-\s*(.+)/)
    return match ? match[1].trim() : purpose
  }
  return purpose
}

// Helper function to check if booking is bulk
function isBulkBooking(purpose: string): boolean {
  return purpose.startsWith("BULK_BOOKING:")
}

// Helper function to extract dates from bulk booking
function extractBulkDates(purpose: string): string[] {
  if (!purpose.startsWith("BULK_BOOKING:")) return []

  const match = purpose.match(/BULK_BOOKING:([^-]+)/)
  if (!match) return []

  return match[1].split(",").map((date) => date.trim())
}

export function BookingList({ bookings, showUserInfo = false, currentUserId }: BookingListProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancellingId(bookingId)
      const result = await cancelBooking(bookingId)

      if (result.success) {
        toast.success("Booking cancelled successfully")
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast.error(error instanceof Error ? error.message : "Failed to cancel booking")
    } finally {
      setCancellingId(null)
    }
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
          const isUserBooking = currentUserId === booking.user.id
          const canCancel = isUserBooking && isPending(booking.status)
          const courseTitle = extractCourseTitle(booking.purpose)
          const isBulk = isBulkBooking(booking.purpose)
          const bulkDates = isBulk ? extractBulkDates(booking.purpose) : []

          return (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">{courseTitle}</CardTitle>
                    {isBulk && (
                      <Badge variant="outline" className="text-xs">
                        Bulk ({bulkDates.length} dates)
                      </Badge>
                    )}
                  </div>
                  <Badge variant={getStatusVariant(booking.status)}>{formatStatus(booking.status)}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>
                      {isBulk ? (
                        <span>
                          {new Date(booking.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                          {bulkDates.length > 1 && ` (+${bulkDates.length - 1} more)`}
                        </span>
                      ) : (
                        new Date(booking.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      {booking.startTime} - {booking.endTime}
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

                {showUserInfo && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-4 w-4 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {booking.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span>{booking.user.name}</span>
                  </div>
                )}

                {isBulk && bulkDates.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Bulk Booking Dates:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {bulkDates.map((date, index) => (
                        <div key={index} className="text-xs bg-gray-100 rounded px-2 py-1">
                          {new Date(date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                  {canCancel && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="flex items-center gap-2"
                    >
                      {cancellingId === booking.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {cancellingId === booking.id ? "Cancelling..." : "Cancel"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </>
  )
}
