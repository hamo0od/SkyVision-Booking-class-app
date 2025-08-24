"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users, FileText, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cancelBooking } from "@/app/actions/bookings"
import { useToast } from "@/hooks/use-toast"
import { BookingDetailsModal } from "./booking-details-modal"

interface Booking {
  id: string
  purpose: string
  startTime: Date
  endTime: Date
  participants: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  submittedAt: Date
  classroom: {
    name: string
  }
  user: {
    name: string
    email: string
  }
  department?: string
  attachmentPath?: string
  isBulkBooking?: boolean
  bulkBookingId?: string
}

interface BookingListProps {
  bookings: Booking[]
  showUserInfo?: boolean
  onBookingUpdate?: () => void
}

export function BookingList({ bookings, showUserInfo = false, onBookingUpdate }: BookingListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const { toast } = useToast()

  const isPending = (status: string) => {
    return status.toUpperCase() === "PENDING"
  }

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId)
    try {
      const result = await cancelBooking(bookingId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Booking cancelled successfully",
        })
        onBookingUpdate?.()
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
        description: "Failed to cancel booking",
        variant: "destructive",
      })
    } finally {
      setCancellingId(null)
    }
  }

  const getDisplayTitle = (booking: Booking) => {
    if (booking.isBulkBooking && booking.purpose.startsWith("BULK_BOOKING:")) {
      // Extract the actual course title from the bulk booking purpose
      const parts = booking.purpose.split(",")
      if (parts.length > 2) {
        return parts.slice(2).join(",").trim()
      }
    }
    return booking.purpose
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

  if (bookings.length === 0) {
    return <div className="text-center py-8 text-gray-500">No bookings found.</div>
  }

  return (
    <>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {getDisplayTitle(booking)}
                </CardTitle>
                <div className="flex items-center gap-2 ml-4">
                  <Badge variant="outline" className={`${getStatusColor(booking.status)} font-medium`}>
                    {booking.status}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => setSelectedBooking(booking)} className="shrink-0">
                    <FileText className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">{format(new Date(booking.startTime), "EEE, MMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-green-500" />
                  <span>
                    {format(new Date(booking.startTime), "h:mm a")} - {format(new Date(booking.endTime), "h:mm a")}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-red-500" />
                  <span>{booking.classroom.name}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2 text-purple-500" />
                  <span>{booking.participants} participants</span>
                </div>
              </div>

              {showUserInfo && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <div>
                      <strong>Requested by:</strong> {booking.user.name}
                    </div>
                    <div>
                      <strong>Email:</strong> {booking.user.email}
                    </div>
                    {booking.department && (
                      <div>
                        <strong>Department:</strong> {booking.department}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-sm text-gray-500">
                  Submitted {format(new Date(booking.submittedAt), "EEE, MMM dd, yyyy")}
                </div>

                {isPending(booking.status) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancel(booking.id)}
                    disabled={cancellingId === booking.id}
                    className="shrink-0"
                  >
                    {cancellingId === booking.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      "Cancel Booking"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        showUserInfo={showUserInfo}
      />
    </>
  )
}
