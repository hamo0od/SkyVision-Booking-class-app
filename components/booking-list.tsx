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
  id: string
  classroom_name: string
  date: string
  start_time: string
  end_time: string
  purpose: string
  participants: number
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
  created_at: string
  file_path?: string
  department: string
}

interface BookingListProps {
  bookings: Booking[]
}

// Helper functions for status checking
const isPending = (status: string) => status.toUpperCase() === "PENDING"
const isApproved = (status: string) => status.toUpperCase() === "APPROVED"
const isRejected = (status: string) => status.toUpperCase() === "REJECTED"
const isCancelled = (status: string) => status.toUpperCase() === "CANCELLED"

// Helper function to extract course title from purpose
const extractCourseTitle = (purpose: string) => {
  if (purpose.includes("BULK_BOOKING:")) {
    // Extract the actual course name after the dates
    const parts = purpose.split(" - ")
    return parts.length > 1 ? parts.slice(1).join(" - ") : purpose
  }
  return purpose
}

// Helper function to format status for display
const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

export function BookingList({ bookings }: BookingListProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleCancel = async (bookingId: string) => {
    try {
      setCancellingId(bookingId)
      const result = await cancelBooking(bookingId)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        // Refresh the page to show updated data
        window.location.reload()
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
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
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
      <div className="text-center py-8">
        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
        <p className="text-gray-500">You haven't made any classroom bookings yet.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {extractCourseTitle(booking.purpose)}
                </CardTitle>
                <div className="flex items-center gap-2 ml-4">
                  <Badge
                    variant={
                      isPending(booking.status)
                        ? "secondary"
                        : isApproved(booking.status)
                          ? "default"
                          : isRejected(booking.status)
                            ? "destructive"
                            : "outline"
                    }
                    className={
                      isPending(booking.status)
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        : isApproved(booking.status)
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : isRejected(booking.status)
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }
                  >
                    {formatStatus(booking.status)}
                  </Badge>
                  {booking.purpose.includes("BULK_BOOKING:") && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Bulk ({booking.purpose.split(",").length} dates)
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{formatDate(booking.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>{booking.classroom_name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span>{booking.participants} participants</span>
                </div>
              </div>

              {booking.purpose.includes("BULK_BOOKING:") && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Bulk Booking Dates:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                    {booking.purpose
                      .split("BULK_BOOKING:")[1]
                      .split(" - ")[0]
                      .split(",")
                      .map((date, index) => (
                        <div key={index} className="text-blue-700 font-medium">
                          {new Date(date.trim()).toLocaleDateString("en-US", {
                            month: "numeric",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FileText className="h-3 w-3" />
                  <span>Submitted {new Date(booking.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isPending(booking.status) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="h-8 px-3 text-xs"
                    >
                      {cancellingId === booking.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        "Cancel"
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBooking(booking)}
                    className="h-8 px-3 text-xs"
                  >
                    Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </>
  )
}
