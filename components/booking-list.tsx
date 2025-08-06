'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, X, UserCheck, Users, BookOpen } from 'lucide-react'
import { cancelBooking } from "@/app/actions/bookings"
import { useState } from "react"

interface Booking {
  id: string
  startTime: string
  endTime: string
  purpose: string
  instructorName: string
  trainingOrder: string
  participants: number
  ecaaApproval: boolean
  approvalNumber?: string
  qualifications?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  classroom: {
    id: string
    name: string
    capacity: number
  }
}

interface BookingListProps {
  bookings: Booking[]
}

export function BookingList({ bookings }: BookingListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    setCancellingId(bookingId)
    setMessage(null)

    try {
      const result = await cancelBooking(bookingId)
      setMessage({ type: 'success', text: result.message })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to cancel booking' 
      })
    } finally {
      setCancellingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const canCancel = (booking: Booking) => {
    return (booking.status === 'PENDING' || booking.status === 'APPROVED') && 
           new Date(booking.startTime) > new Date()
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Calendar className="mx-auto h-12 w-12 mb-4 text-gray-300" />
          <p>No bookings found. Create your first booking above!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">My Bookings</h3>
        {bookings.length > 3 && (
          <Badge variant="secondary" className="text-xs">
            {bookings.length} total
          </Badge>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
        {bookings.map((booking) => (
          <Card key={booking.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {booking.classroom.name}
                </CardTitle>
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  <span>{formatDate(booking.startTime)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-green-500" />
                  <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-red-500" />
                  <span>Capacity: {booking.classroom.capacity}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2 text-purple-500" />
                  <span>{booking.participants} participants</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <BookOpen className="h-4 w-4 mr-2 text-indigo-500" />
                  <span className="font-medium">Course:</span>
                  <span className="ml-1">{booking.purpose}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <UserCheck className="h-4 w-4 mr-2 text-orange-500" />
                  <span className="font-medium">Instructor:</span>
                  <span className="ml-1">{booking.instructorName}</span>
                </div>
              </div>

              {canCancel(booking) && (
                <div className="pt-3 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancel(booking.id)}
                    disabled={cancellingId === booking.id}
                    className="w-full sm:w-auto"
                  >
                    {cancellingId === booking.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel Booking
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {bookings.length > 3 && (
          <div className="text-center text-sm text-gray-500 py-2">
            Scroll to see all bookings
          </div>
        )}
      </div>
    </div>
  )
}
