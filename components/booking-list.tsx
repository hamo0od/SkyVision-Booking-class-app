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
      // The page will refresh automatically due to revalidatePath
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

  const canCancelBooking = (booking: Booking) => {
    return (booking.status === 'PENDING' || booking.status === 'APPROVED') && 
           new Date(booking.startTime) > new Date()
  }

  if (bookings.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">No bookings found</p>
          <p className="text-sm text-gray-400 text-center mt-2">
            Create your first booking using the form above
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full">
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="max-h-96 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
        {bookings.map((booking) => (
          <Card key={booking.id} className="w-full hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {booking.classroom.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(booking.status)} font-medium`}>
                    {booking.status}
                  </Badge>
                  {canCancelBooking(booking) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      {cancellingId === booking.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">{formatDate(booking.startTime)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-green-500" />
                  <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                  <span>Capacity: {booking.classroom.capacity}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2 text-orange-500" />
                  <span>{booking.participants} participants</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start text-sm text-gray-600">
                  <BookOpen className="h-4 w-4 mr-2 text-indigo-500 mt-0.5" />
                  <div>
                    <span className="font-medium">Course: </span>
                    <span>{booking.purpose}</span>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <UserCheck className="h-4 w-4 mr-2 text-teal-500" />
                  <span className="font-medium">Instructor: </span>
                  <span className="ml-1">{booking.instructorName}</span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Training Order: </span>
                  <span>{booking.trainingOrder}</span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <span className="font-medium">ECAA Approval: </span>
                  {booking.ecaaApproval ? (
                    <span className="text-green-600">
                      Yes - {booking.approvalNumber}
                    </span>
                  ) : (
                    <span className="text-blue-600">
                      No - {booking.qualifications}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {bookings.length > 3 && (
        <div className="text-center mt-2 text-sm text-gray-500">
          Scroll to see all {bookings.length} bookings
        </div>
      )}
    </div>
  )
}
