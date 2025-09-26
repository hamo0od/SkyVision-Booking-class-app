"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookingDetailsModal } from "./booking-details-modal"
import { cancelBooking } from "@/app/actions/bookings"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, MapPin, Users, Eye, X, CalendarDays, Building2, User, Loader2 } from "lucide-react"

interface Booking {
  id: string
  startTime: Date | string
  endTime: Date | string
  purpose: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  participants: number
  ecaaInstructorApproval: boolean
  ecaaApprovalNumber: string | null
  qualifications: string | null
  instructorName: string
  trainingOrder: string
  courseReference: string | null
  department?: string
  ecaaApprovalFile: string | null
  trainingOrderFile: string | null
  bulkBookingId: string | null
  user?: {
    name?: string | null
    email?: string
  }
  classroom: {
    name: string
    capacity: number
  }
}

interface BookingListProps {
  bookings: Booking[]
  showUserInfo?: boolean
}

export function BookingList({ bookings, showUserInfo = false }: BookingListProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)
  const { toast } = useToast()

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200"
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "✓"
      case "REJECTED":
        return "✗"
      default:
        return "⏳"
    }
  }

  const isPending = (status: string) => {
    return status.toUpperCase() === "PENDING"
  }

  const isBulkBooking = (purpose: string) => {
    return purpose.startsWith("BULK_BOOKING:")
  }

  const getBulkBookingInfo = (purpose: string) => {
    if (!isBulkBooking(purpose)) return null
    const [, datesStr, actualPurpose] = purpose.split(":", 3)
    const dates = datesStr.split(",")
    return { dates, actualPurpose }
  }

  const getDisplayTitle = (purpose: string) => {
    const bulkInfo = getBulkBookingInfo(purpose)
    return bulkInfo ? bulkInfo.actualPurpose : purpose
  }

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return
    }

    setCancellingBookingId(bookingId)
    try {
      const result = await cancelBooking(bookingId)
      if (result.success) {
        toast({
          title: "Booking cancelled",
          description: result.message || "Your booking has been cancelled successfully.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel booking",
        variant: "destructive",
      })
    } finally {
      setCancellingBookingId(null)
    }
  }

  if (bookings.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No bookings found</p>
          <p className="text-gray-400 text-sm mt-1">Your bookings will appear here once you make a reservation</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {bookings.map((booking) => {
          const bulkInfo = getBulkBookingInfo(booking.purpose)
          const displayTitle = getDisplayTitle(booking.purpose)
          const startTime = typeof booking.startTime === "string" ? new Date(booking.startTime) : booking.startTime
          const endTime = typeof booking.endTime === "string" ? new Date(booking.endTime) : booking.endTime

          return (
            <Card
              key={booking.id}
              className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-shadow duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg line-clamp-2">{displayTitle}</CardTitle>
                      {bulkInfo && (
                        <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                          <CalendarDays className="h-3 w-3" />
                          Bulk ({bulkInfo.dates.length} dates)
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(booking.status)} font-medium shrink-0 ml-2`}>
                    <span className="mr-1">{getStatusIcon(booking.status)}</span>
                    {booking.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>
                      {startTime.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>
                      {startTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {endTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{booking.classroom.name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>{booking.participants} participants</span>
                  </div>

                  {showUserInfo && booking.user && (
                    <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                      <User className="h-4 w-4 shrink-0" />
                      <span>{booking.user.name || booking.user.email}</span>
                    </div>
                  )}

                  {booking.department && (
                    <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span>{booking.department}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(booking)}
                    className="flex-1 bg-transparent"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>

                  {isPending(booking.status) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingBookingId === booking.id}
                      className="flex-1"
                    >
                      {cancellingBookingId === booking.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <X className="h-4 w-4 mr-1" />
                      )}
                      {cancellingBookingId === booking.id ? "Cancelling..." : "Cancel"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <BookingDetailsModal booking={selectedBooking} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
