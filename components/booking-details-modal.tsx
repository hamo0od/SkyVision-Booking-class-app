"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users, FileText, User, Building } from "lucide-react"
import { PdfViewer } from "./pdf-viewer"
import { useState } from "react"

interface Booking {
  id: string
  date: Date
  startTime: string
  endTime: string
  purpose: string
  participants: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  department: string
  filePath?: string | null
  classroom: {
    id: string
    name: string
    capacity: number
  }
  user: {
    id: string
    name: string
    email: string
  }
}

interface BookingDetailsModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
}

// Helper function to get status badge variant
function getStatusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "default"
    case "REJECTED":
      return "destructive"
    default:
      return "secondary"
  }
}

// Helper function to format status display
function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

// Helper function to extract course title from bulk booking purpose
function extractCourseTitle(purpose: string): string {
  if (purpose.startsWith("BULK_BOOKING:")) {
    const match = purpose.match(/BULK_BOOKING:[^-]+-\s*(.+)/)
    return match ? match[1].trim() : purpose
  }
  return purpose
}

// Helper function to check if booking is bulk
function isBulkBooking(purpose: string): boolean {
  return purpose.startsWith("BULK_BOOKING:")
}

// Helper function to extract dates from bulk booking
function extractBulkDates(purpose: string): string[] {
  if (!purpose.startsWith("BULK_BOOKING:")) return []

  const match = purpose.match(/BULK_BOOKING:([^-]+)/)
  if (!match) return []

  return match[1].split(",").map((date) => date.trim())
}

export function BookingDetailsModal({ booking, isOpen, onClose }: BookingDetailsModalProps) {
  const [showPdfViewer, setShowPdfViewer] = useState(false)

  // Add null check at the beginning
  if (!booking) {
    return null
  }

  const courseTitle = extractCourseTitle(booking.purpose)
  const isBulk = isBulkBooking(booking.purpose)
  const bulkDates = isBulk ? extractBulkDates(booking.purpose) : []

  const handleViewFile = () => {
    if (booking.filePath) {
      setShowPdfViewer(true)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <DialogTitle className="text-xl font-semibold pr-4">{courseTitle}</DialogTitle>
              <Badge variant={getStatusVariant(booking.status)}>{formatStatus(booking.status)}</Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(booking.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">
                    {booking.startTime} - {booking.endTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Classroom</p>
                  <p className="font-medium">{booking.classroom.name}</p>
                  <p className="text-sm text-gray-500">Capacity: {booking.classroom.capacity} people</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Participants</p>
                  <p className="font-medium">{booking.participants} people</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Booked by</p>
                  <p className="font-medium">{booking.user.name}</p>
                  <p className="text-sm text-gray-500">{booking.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{booking.department}</p>
                </div>
              </div>
            </div>

            {/* Bulk Booking Dates */}
            {isBulk && bulkDates.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Bulk Booking Dates ({bulkDates.length} dates)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {bulkDates.map((date, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="font-medium">
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Title */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Course Title
              </h3>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{courseTitle}</p>
            </div>

            {/* File Attachment */}
            {booking.filePath && (
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Attached File
                </h3>
                <Button onClick={handleViewFile} variant="outline" className="w-full bg-transparent">
                  View Attached File
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal */}
      {showPdfViewer && booking.filePath && (
        <PdfViewer filePath={booking.filePath} isOpen={showPdfViewer} onClose={() => setShowPdfViewer(false)} />
      )}
    </>
  )
}
