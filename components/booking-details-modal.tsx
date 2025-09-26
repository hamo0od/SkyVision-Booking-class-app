"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users, FileText, Building2, Plane } from "lucide-react"
import { PDFViewer } from "./pdf-viewer"
import { useState } from "react"

interface Booking {
  id: number
  date: Date
  startTime: string
  endTime: string
  purpose: string
  participants: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  department: string
  isECAA: boolean
  ecaaLicense?: string | null
  ecaaInstructor?: string | null
  attachmentPath?: string | null
  classroom: {
    name: string
    capacity: number
  }
  user: {
    name: string
    email: string
  }
  createdAt: Date
}

interface BookingDetailsModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
}

// Helper functions for status checking
const isPending = (status: string) => status.toUpperCase() === "PENDING"
const isApproved = (status: string) => status.toUpperCase() === "APPROVED"
const isRejected = (status: string) => status.toUpperCase() === "REJECTED"

// Helper function to extract course title from bulk booking purpose
const extractCourseTitle = (purpose: string) => {
  if (purpose.includes("BULK_BOOKING:")) {
    const parts = purpose.split("\n")
    return parts.length > 1 ? parts[1] : "Bulk Booking"
  }
  return purpose
}

// Helper function to check if booking is bulk
const isBulkBooking = (purpose: string) => purpose.includes("BULK_BOOKING:")

// Helper function to extract bulk dates
const extractBulkDates = (purpose: string) => {
  if (!isBulkBooking(purpose)) return []

  const match = purpose.match(/BULK_BOOKING:(.+?)(?:\n|$)/)
  if (match) {
    return match[1].split(",").map((date) => date.trim())
  }
  return []
}

export function BookingDetailsModal({ booking, isOpen, onClose }: BookingDetailsModalProps) {
  const [showPDFViewer, setShowPDFViewer] = useState(false)

  // Add null check at the beginning
  if (!booking) {
    return null
  }

  const courseTitle = extractCourseTitle(booking.purpose)
  const bulkDates = isBulkBooking(booking.purpose) ? extractBulkDates(booking.purpose) : []

  const getStatusBadge = (status: string) => {
    if (isPending(status)) {
      return <Badge className="bg-yellow-100 text-yellow-800">⏳ PENDING</Badge>
    } else if (isApproved(status)) {
      return <Badge className="bg-green-100 text-green-800">✓ APPROVED</Badge>
    } else if (isRejected(status)) {
      return <Badge className="bg-red-100 text-red-800">✗ REJECTED</Badge>
    }
    return <Badge>{status}</Badge>
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01 ${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const isPDFFile = (filePath: string) => {
    return filePath.toLowerCase().endsWith(".pdf")
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <DialogTitle className="text-xl font-bold">{courseTitle}</DialogTitle>
              {getStatusBadge(booking.status)}
            </div>
            {isBulkBooking(booking.purpose) && (
              <Badge variant="outline" className="w-fit">
                📅 Bulk Booking ({bulkDates.length} dates)
              </Badge>
            )}
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-sm text-gray-600">{formatDate(booking.date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-sm text-gray-600">
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">Classroom</p>
                    <p className="text-sm text-gray-600">
                      {booking.classroom.name} (Capacity: {booking.classroom.capacity})
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Participants</p>
                    <p className="text-sm text-gray-600">{booking.participants} people</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Department</p>
                    <p className="text-sm text-gray-600">{booking.department}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg">👤</span>
                  <div>
                    <p className="font-medium">Requested by</p>
                    <p className="text-sm text-gray-600">{booking.user.name}</p>
                    <p className="text-xs text-gray-500">{booking.user.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Booking Dates */}
            {isBulkBooking(booking.purpose) && bulkDates.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Bulk Booking Dates
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {bulkDates.map((date, index) => (
                    <div key={index} className="bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm text-center">
                      {new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ECAA Information */}
            {booking.isECAA && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 mb-3">
                  <Plane className="h-5 w-5 text-blue-600" />
                  ECAA Training Details
                </h3>
                <div className="space-y-2">
                  {booking.ecaaLicense && (
                    <div>
                      <span className="font-medium">License Number: </span>
                      <span className="text-gray-700">{booking.ecaaLicense}</span>
                    </div>
                  )}
                  {booking.ecaaInstructor && (
                    <div>
                      <span className="font-medium">Instructor: </span>
                      <span className="text-gray-700">{booking.ecaaInstructor}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Course Title */}
            <div>
              <h3 className="font-medium mb-2">Course Title</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{courseTitle}</p>
            </div>

            {/* Attachment */}
            {booking.attachmentPath && (
              <div>
                <h3 className="font-medium flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Attachment
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/api/files${booking.attachmentPath}`, "_blank")}
                  >
                    📎 Download File
                  </Button>
                  {isPDFFile(booking.attachmentPath) && (
                    <Button variant="outline" size="sm" onClick={() => setShowPDFViewer(true)}>
                      👁️ View PDF
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Submission Information */}
            <div className="border-t pt-4">
              <div className="text-sm text-gray-500">
                <p>Booking ID: #{booking.id}</p>
                <p>Submitted: {new Date(booking.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal */}
      {booking.attachmentPath && isPDFFile(booking.attachmentPath) && (
        <PDFViewer
          isOpen={showPDFViewer}
          onClose={() => setShowPDFViewer(false)}
          fileUrl={`/api/files${booking.attachmentPath}`}
        />
      )}
    </>
  )
}
