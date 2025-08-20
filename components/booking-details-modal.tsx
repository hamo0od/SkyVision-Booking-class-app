"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PdfViewer } from "./pdf-viewer"
import { useState } from "react"

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

interface BookingDetailsModalProps {
  booking: Booking
  isOpen: boolean
  onClose: () => void
}

export function BookingDetailsModal({ booking, isOpen, onClose }: BookingDetailsModalProps) {
  const [showEcaaPdf, setShowEcaaPdf] = useState(false)
  const [showTrainingPdf, setShowTrainingPdf] = useState(false)

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

  const bulkInfo = getBulkBookingInfo(booking)

  return (
    <>
      <Dialog open={isOpen && !showEcaaPdf && !showTrainingPdf} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Booking Details
              {getStatusBadge(booking.status)}
            </DialogTitle>
            <DialogDescription>Complete information for this classroom booking</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-600">CLASSROOM</h3>
                <p>{booking.classroom.name}</p>
                <p className="text-sm text-gray-500">Capacity: {booking.classroom.capacity}</p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-600">REQUESTED BY</h3>
                <p>{booking.user.name || booking.user.email}</p>
                <p className="text-sm text-gray-500">{booking.participants} participants</p>
              </div>
            </div>

            {booking.department && (
              <div>
                <h3 className="font-semibold text-sm text-gray-600">DEPARTMENT</h3>
                <p>{booking.department}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-600">START TIME</h3>
                <p>{formatDateTime(booking.startTime)}</p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-600">END TIME</h3>
                <p>{formatDateTime(booking.endTime)}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-gray-600">PURPOSE</h3>
              <p>{bulkInfo ? bulkInfo.actualPurpose : booking.purpose}</p>
            </div>

            {bulkInfo && (
              <div>
                <h3 className="font-semibold text-sm text-gray-600">BULK BOOKING DATES ({bulkInfo.dateCount} dates)</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {bulkInfo.dates.map((date, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {new Date(date).toLocaleDateString()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-600">INSTRUCTOR</h3>
                <p>{booking.instructorName}</p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-600">TRAINING ORDER</h3>
                <p>{booking.trainingOrder}</p>
              </div>
            </div>

            {booking.courseReference && (
              <div>
                <h3 className="font-semibold text-sm text-gray-600">COURSE REFERENCE</h3>
                <p>{booking.courseReference}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-sm text-gray-600">ECAA INSTRUCTOR APPROVAL</h3>
              <p>{booking.ecaaInstructorApproval ? "Yes" : "No"}</p>

              {booking.ecaaInstructorApproval && booking.ecaaApprovalNumber && (
                <div className="mt-2">
                  <h4 className="font-medium text-sm">ECAA Approval Number:</h4>
                  <p className="text-sm">{booking.ecaaApprovalNumber}</p>
                </div>
              )}

              {!booking.ecaaInstructorApproval && booking.qualifications && (
                <div className="mt-2">
                  <h4 className="font-medium text-sm">Qualifications:</h4>
                  <p className="text-sm">{booking.qualifications}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-600">UPLOADED DOCUMENTS</h3>

              {booking.ecaaApprovalFile && (
                <Button variant="outline" size="sm" onClick={() => setShowEcaaPdf(true)} className="mr-2">
                  View ECAA Approval PDF
                </Button>
              )}

              {booking.trainingOrderFile && (
                <Button variant="outline" size="sm" onClick={() => setShowTrainingPdf(true)}>
                  View Training Order PDF
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ECAA PDF Viewer */}
      {booking.ecaaApprovalFile && (
        <PdfViewer
          isOpen={showEcaaPdf}
          onClose={() => setShowEcaaPdf(false)}
          pdfUrl={`/api/files/${booking.ecaaApprovalFile}`}
          title="ECAA Approval Document"
        />
      )}

      {/* Training Order PDF Viewer */}
      {booking.trainingOrderFile && (
        <PdfViewer
          isOpen={showTrainingPdf}
          onClose={() => setShowTrainingPdf(false)}
          pdfUrl={`/api/files/${booking.trainingOrderFile}`}
          title="Training Order Document"
        />
      )}
    </>
  )
}
