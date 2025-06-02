"use client"

import { updateBookingStatus } from "@/app/actions/bookings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Booking {
  id: string
  startTime: Date
  endTime: Date
  purpose: string
  status: string
  user: {
    name: string | null
    email: string
  }
  classroom: {
    name: string
  }
}

interface AdminBookingListProps {
  bookings: Booking[]
  showActions: boolean
}

export function AdminBookingList({ bookings, showActions }: AdminBookingListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const handleStatusUpdate = async (bookingId: string, status: "APPROVED" | "REJECTED") => {
    try {
      await updateBookingStatus(bookingId, status)
    } catch (error) {
      alert("Failed to update booking status")
    }
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">No bookings found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{booking.classroom.name}</CardTitle>
              <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                <strong>Requested by:</strong> {booking.user.name || booking.user.email}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Time:</strong> {new Date(booking.startTime).toLocaleString()} -{" "}
                {new Date(booking.endTime).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Purpose:</strong> {booking.purpose}
              </p>

              {showActions && booking.status === "PENDING" && (
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(booking.id, "APPROVED")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(booking.id, "REJECTED")}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
