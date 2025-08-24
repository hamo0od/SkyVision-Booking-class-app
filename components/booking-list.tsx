"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookingDetailsModal } from "./booking-details-modal"
import { cancelBooking } from "@/app/actions/bookings"
import { Calendar, Clock, MapPin, Users, FileText, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Booking {
  id: string
  purpose: string
  startTime: string
  endTime: string
  status: "pending" | "approved" | "rejected"
  classroom: {
    name: string
  }
  participants: number
  instructorName: string
  trainingOrder: string
  courseReference?: string
  department: string
  ecaaInstructorApproval: boolean
  ecaaApprovalNumber?: string
  qualifications?: string
  createdAt: string
  isBulkBooking?: boolean
  bulkBookingId?: string
}

interface BookingListProps {
  bookings: Booking[]
}

export function BookingList({ bookings }: BookingListProps) {
  const { toast } = useToast()
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
  }

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId)
    try {
      const result = await cancelBooking(bookingId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Booking cancelled successfully",
        })
        // Refresh the page to show updated bookings
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
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "✓"
      case "rejected":
        return "✗"
      default:
        return "⏳"
    }
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Bookings</CardTitle>
          <CardDescription>You haven't made any bookings yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first classroom booking.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Your Bookings
          </CardTitle>
          <CardDescription>Manage your classroom booking requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {booking.courseReference || "Course Title"}
                      </h3>
                      {booking.isBulkBooking && (
                        <Badge variant="outline" className="text-xs">
                          Bulk
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(booking.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{booking.classroom.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{booking.participants} participants</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}{" "}
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                      <span className="text-xs text-gray-500">Submitted {formatDate(booking.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(booking)} className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                    {(booking.status === "pending" || booking.status === "approved") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {cancellingId === booking.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedBooking(null)
        }}
      />
    </>
  )
}
