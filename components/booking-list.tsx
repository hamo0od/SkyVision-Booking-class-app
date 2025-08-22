import type React from "react"
import { Card, CardContent } from "@mui/material"
import Calendar from "@mui/icons-material/CalendarToday"
import type { Booking } from "../types"

interface BookingListProps {
  bookings: Booking[]
}

const BookingList: React.FC<BookingListProps> = ({ bookings }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Your Bookings</h2>

      {/* Make this div scrollable */}
      <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No bookings found. Create your first booking above!</p>
            </CardContent>
          </Card>
        ) : (
          bookings.map((booking) => (
            <Card key={booking.id} className="shadow-sm">
              {/* Keep all existing booking card content */}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default BookingList
