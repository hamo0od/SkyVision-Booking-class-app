"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cancelBooking } from "@/app/actions/bookings"
import { BookingDetailsModal } from "./booking-details-modal"
import { useToast } from "@/hooks/use-toast"

interface Booking {
  id: string
  startTime: string
  endTime: string
  purpose: string
  status: string
  participants: number
  instructorName: string
  trainingOrder: string
  courseReference?: string
  department?: string
  ecaaInstructorApproval: boolean
  ecaaApprovalNumber?: string
  qualifications?: string
  ecaaApprovalFile?: string
  trainingOrderFile?: string
  bulkBookingId?: string
  user: {
    name?: string
    email: string
  }
  classroom: {
    name: string
    capacity: number
  }
}

interface BookingListProps {
  bookings: Booking[]
}

export function BookingList({ bookings }: BookingListProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  const handleCancel = async (bookingId: string) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      try {
        const result = await cancelBooking(bookingId)
        if (result.success) {
          toast({
            title: "Success",
            description: result.message,
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to cancel booking",
          variant: "destructive",
        })
      }
    }
  }

  const openModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
  }

  const isBulkBooking = (booking: Booking) => {
    return booking.purpose.startsWith("BULK_BOOKING:")
  }

  const getBulkBookingInfo = (booking: Booking) => {
    if (!isBulkBooking(booking)) return null

    const [, datesStr, actualPurpose] = booking.purpose.split(":", 3)
    const dates = datesStr.split(",")

    return {
      dates,
      actualPurpose,
      dateCount: dates.length,
    }
  }

  const canCancel = (booking: Booking) => {
    if (booking.status === "REJECTED") return false
    if (booking.status === "APPROVED" && new Date(booking.startTime) < new Date()) return false
    return true
  }

  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">No bookings found.</p>
          </CardContent>
        </Card>
      ) : (
        bookings.map((booking) => {
          const bulkInfo = getBulkBookingInfo(booking)

          return (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {booking.classroom.name}
                      {bulkInfo && (
                        <span className="ml-2 text-sm font-normal text-blue-600">
                          (Bulk: {bulkInfo.dateCount} dates)
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {booking.participants} participants
                      {booking.department && ` • ${booking.department}`}
                    </CardDescription>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Start:</strong> {formatDateTime(booking.startTime)}
                    </div>
                    <div>
                      <strong>End:</strong> {formatDateTime(booking.endTime)}
                    </div>
                    <div>
                      <strong>Instructor:</strong> {booking.instructorName}
                    </div>
                    <div>
                      <strong>Training Order:</strong> {booking.trainingOrder}
                    </div>
                    {booking.courseReference && (
                      <div>
                        <strong>Course Reference:</strong> {booking.courseReference}
                      </div>
                    )}
                    {booking.department && (
                      <div>
                        <strong>Department:</strong> {booking.department}
                      </div>
                    )}
                  </div>

                  <div>
                    <strong>Purpose:</strong> {bulkInfo ? bulkInfo.actualPurpose : booking.purpose}
                  </div>

                  {bulkInfo && (
                    <div>
                      <strong>Selected Dates:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {bulkInfo.dates.map((date, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {new Date(date).toLocaleDateString()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => openModal(booking)}>
                      View Details
                    </Button>

                    {canCancel(booking) && (
                      <Button size="sm" variant="destructive" onClick={() => handleCancel(booking.id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}

      {selectedBooking && (
        <BookingDetailsModal booking={selectedBooking} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  )
}
