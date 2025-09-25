"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users, FileText, User, Building } from "lucide-react"
import { PdfViewer } from "./pdf-viewer"
import { useState } from "react"

interface Booking {
  id: string
  startTime: Date
  endTime: Date
  purpose: string
  instructorName: string
  trainingOrder: string
  courseReference: string | null
  department: string
  participants: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: Date
  classroom: {
    id: string
    name: string
    capacity: number
  }
  user: {
    id: string
    name: string | null
    email: string
  }
  ecaaInstructorApproval: boolean
  ecaaApprovalNumber: string | null
  qualifications: string | null
  ecaaApprovalFile: string | null
  trainingOrderFile: string | null
  bulkBookingId: string | null
}

interface BookingDetailsModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
}

export function BookingDetailsModal({ booking, isOpen, onClose }: BookingDetailsModalProps) {
  const [showEcaaPdf, setShowEcaaPdf] = useState(false)
  const [showTrainingOrderPdf, setShowTrainingOrderPdf] = useState(false)

  // Early return if booking is null to prevent errors
  if (!booking) {
    return null
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date))
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date))
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200"
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDisplayTitle = (booking: Booking) => {
    if (booking.purpose.startsWith("BULK_BOOKING:")) {
      const parts = booking.purpose.split(":")
      if (parts.length >= 3) {
        return parts.slice(2).join(":")
      }
    }
    return booking.purpose
  }

  const isBulkBooking = (booking: Booking) => {
    return booking.purpose.startsWith("BULK_BOOKING:")
  }

  const getBulkBookingDates = (booking: Booking) => {
    if (!isBulkBooking(booking)) return []
    const parts = booking.purpose.split(":")
    if (parts.length >= 2) {
      return parts[1].split(",")
    }
    return []
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{getDisplayTitle(booking)}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status and Basic Info */}
            <div className="flex items-center justify-between">
              <Badge className={`${getStatusColor(booking.status)} border text-sm px-3 py-1`}>{booking.status}</Badge>
              <span className="text-sm text-gray-500">Submitted on {formatDate(booking.createdAt)}</span>
            </div>

            {/* Bulk Booking Info */}
            {isBulkBooking(booking) && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Bulk Booking Details</h3>
                <p className="text-sm text-blue-700 mb-2">
                  This booking covers {getBulkBookingDates(booking).length} dates:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {getBulkBookingDates(booking).map((dateStr, index) => (
                    <div key={index} className="bg-white p-2 rounded border border-blue-300">
                      <span className="text-sm font-medium">
                        {new Date(dateStr).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Date</p>
                  <p className="text-sm text-gray-600">{formatDate(booking.startTime)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Time</p>
                  <p className="text-sm text-gray-600">
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Location and Participants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Classroom</p>
                  <p className="text-sm text-gray-600">
                    {booking.classroom.name} (Capacity: {booking.classroom.capacity})
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Participants</p>
                  <p className="text-sm text-gray-600">{booking.participants} people</p>
                </div>
              </div>
            </div>

            {/* Instructor and Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Instructor</p>
                  <p className="text-sm text-gray-600">{booking.instructorName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Department</p>
                  <p className="text-sm text-gray-600">{booking.department}</p>
                </div>
              </div>
            </div>

            {/* Training Details */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Training Order</p>
                <p className="text-sm text-gray-600">{booking.trainingOrder}</p>
              </div>
              {booking.courseReference && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Course Reference</p>
                  <p className="text-sm text-gray-600">{booking.courseReference}</p>
                </div>
              )}
            </div>

            {/* ECAA Approval Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">ECAA Instructor Approval</h3>
              {booking.ecaaInstructorApproval ? (
                <div className="space-y-2">
                  <p className="text-sm text-green-700">✓ Has ECAA instructor approval</p>
                  {booking.ecaaApprovalNumber && (
                    <p className="text-sm text-gray-600">Approval Number: {booking.ecaaApprovalNumber}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-orange-700">⚠ No ECAA instructor approval</p>
                  {booking.qualifications && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Qualifications:</p>
                      <p className="text-sm text-gray-600">{booking.qualifications}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* File Downloads */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Documents</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                {booking.trainingOrderFile && (
                  <Button
                    variant="outline"
                    onClick={() => setShowTrainingOrderPdf(true)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View Training Order
                  </Button>
                )}
                {booking.ecaaApprovalFile && (
                  <Button variant="outline" onClick={() => setShowEcaaPdf(true)} className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    View ECAA Approval
                  </Button>
                )}
              </div>
            </div>

            {/* Requester Info */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500">Requested by: {booking.user.name || booking.user.email}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Viewers */}
      {showTrainingOrderPdf && booking.trainingOrderFile && (
        <PdfViewer
          fileUrl={`/api/files/${booking.trainingOrderFile}`}
          fileName="Training Order"
          isOpen={showTrainingOrderPdf}
          onClose={() => setShowTrainingOrderPdf(false)}
        />
      )}

      {showEcaaPdf && booking.ecaaApprovalFile && (
        <PdfViewer
          fileUrl={`/api/files/${booking.ecaaApprovalFile}`}
          fileName="ECAA Approval"
          isOpen={showEcaaPdf}
          onClose={() => setShowEcaaPdf(false)}
        />
      )}
    </>
  )
}
