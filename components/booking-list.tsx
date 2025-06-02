import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Booking {
  id: string
  startTime: Date
  endTime: Date
  purpose: string
  status: string
  classroom: {
    name: string
  }
}

interface BookingListProps {
  bookings: Booking[]
}

export function BookingList({ bookings }: BookingListProps) {
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

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">No bookings yet</p>
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
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Time:</strong> {new Date(booking.startTime).toLocaleString()} -{" "}
                {new Date(booking.endTime).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Purpose:</strong> {booking.purpose}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
