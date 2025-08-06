'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, User, Users, BookOpen, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface Booking {
  id: string
  classroom: {
    name: string
    capacity: number
  }
  startTime: string
  endTime: string
  courseTitle: string
  instructorName: string
  participants: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  trainingOrder: string
  ecaaApproval: boolean
  approvalNumber?: string
  qualifications?: string
}

interface BookingTimelineProps {
  bookings: Booking[]
}

export function BookingTimeline({ bookings }: BookingTimelineProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return '✓'
      case 'rejected':
        return '✗'
      default:
        return '⏳'
    }
  }

  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            My Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No bookings found</p>
            <p className="text-sm">Your booking requests will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          My Bookings ({bookings.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
          {sortedBookings.map((booking, index) => (
            <div key={booking.id} className="relative">
              {/* Timeline line */}
              {index < sortedBookings.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200 -z-10" />
              )}
              
              <div className="flex gap-4">
                {/* Status indicator */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold ${getStatusColor(booking.status)}`}>
                  {getStatusIcon(booking.status)}
                </div>
                
                {/* Booking details */}
                <div className="flex-1 min-w-0">
                  <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {booking.courseTitle}
                        </h3>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{booking.classroom.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(booking.startTime), 'MMM dd, HH:mm')} - 
                          {format(new Date(booking.endTime), 'HH:mm')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{booking.instructorName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{booking.participants} participants</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span>Order: {booking.trainingOrder}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-xs">
                          ECAA: {booking.ecaaApproval ? 'Approved' : 'Not Required'}
                        </span>
                      </div>
                    </div>
                    
                    {booking.approvalNumber && (
                      <div className="mt-2 text-xs text-gray-500">
                        Approval #: {booking.approvalNumber}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
