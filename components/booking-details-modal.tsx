"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  GraduationCap,
  Award,
  BookOpen,
  X,
  FileText,
  Eye,
  CalendarDays,
} from "lucide-react"
import { useState } from "react"
import { PDFViewer } from "./pdf-viewer"

interface Booking {
  id: string
  startTime: Date
  endTime: Date
  purpose: string
  status: string
  participants: number
  ecaaInstructorApproval: boolean
  ecaaApprovalNumber: string | null
  qualifications: string | null
  instructorName: string
  trainingOrder: string
  courseReference: string | null
  ecaaApprovalFile: string | null
  trainingOrderFile: string | null
  bulkBookingId: string | null
  user: {
    name: string | null
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
  const [pdfViewer, setPdfViewer] = useState<{ filePath: string; fileName: string } | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200"
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "✓"
      case "REJECTED":
        return "✗"
      default:
        return "⏳"
    }
  }

  const isBulkBooking = (purpose: string) => {
    return purpose.startsWith("BULK_BOOKING:")
  }

  const getBulkBookingInfo = (purpose: string) => {
    if (!isBulkBooking(purpose)) return null
    const [, datesStr, actualPurpose] = purpose.split(":", 3)
    const dates = datesStr.split(",")
    return { dates, actualPurpose }
  }

  const openPDFViewer = (filePath: string, fileName: string) => {
    setPdfViewer({ filePath, fileName })
  }

  const bulkInfo = getBulkBookingInfo(booking.purpose)
  const displayPurpose = bulkInfo ? bulkInfo.actualPurpose : booking.purpose

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Booking Details - {booking.classroom.name}
                {bulkInfo && (
                  <Badge variant="outline" className="ml-2 flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Bulk ({bulkInfo.dates.length} dates)
                  </Badge>
                )}
              </DialogTitle>
              <Badge className={`${getStatusColor(booking.status)} font-medium`}>
                <span className="mr-1">{getStatusIcon(booking.status)}</span>
                {booking.status}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Requested By</label>
                  <p className="text-gray-900">{booking.user.name || booking.user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{booking.user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Classroom</label>
                  <p className="text-gray-900">
                    {booking.classroom.name} (Capacity: {booking.classroom.capacity})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Booking ID</label>
                  <p className="text-gray-900 font-mono text-sm">{booking.id}</p>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date & Time
              </h3>
              {bulkInfo ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Bulk Booking Dates</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {bulkInfo.dates.map((date, index) => (
                        <div key={index} className="bg-white p-2 rounded border text-center">
                          <span className="text-sm font-medium">
                            {new Date(date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Session Time</label>
                    <p className="text-gray-900 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(booking.startTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(booking.endTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date</label>
                    <p className="text-gray-900">
                      {new Date(booking.startTime).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Time</label>
                    <p className="text-gray-900 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(booking.startTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(booking.endTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Training Details */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Training Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Instructor Name</label>
                  <p className="text-gray-900">{booking.instructorName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Number of Participants</label>
                  <p className="text-gray-900 flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {booking.participants}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Training Order</label>
                  <p className="text-gray-900">{booking.trainingOrder}</p>
                </div>
                {booking.courseReference && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Course Reference</label>
                    <p className="text-gray-900">{booking.courseReference}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ECAA Compliance */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                ECAA Instructor Approval
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">ECAA Instructor Approval Status</label>
                  <p className="text-gray-900">
                    {booking.ecaaInstructorApproval ? (
                      <span className="text-green-600 font-medium">✓ ECAA Instructor Approved</span>
                    ) : (
                      <span className="text-orange-600 font-medium">✗ Not ECAA Instructor Approved</span>
                    )}
                  </p>
                </div>
                {booking.ecaaInstructorApproval && booking.ecaaApprovalNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Approval Number</label>
                    <p className="text-gray-900 font-mono">{booking.ecaaApprovalNumber}</p>
                  </div>
                )}
                {!booking.ecaaInstructorApproval && booking.qualifications && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Qualifications</label>
                    <p className="text-gray-900">{booking.qualifications}</p>
                  </div>
                )}
              </div>
            </div>

            {/* File Attachments */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Attachments
              </h3>
              <div className="space-y-3">
                {booking.trainingOrderFile && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Training Order PDF</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPDFViewer(booking.trainingOrderFile!, "Training Order.pdf")}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                )}
                {booking.ecaaApprovalFile && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">ECAA Approval PDF</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPDFViewer(booking.ecaaApprovalFile!, "ECAA Approval.pdf")}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Course Title */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Course Title
              </h3>
              <p className="text-gray-900 leading-relaxed">{displayPurpose}</p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal */}
      {pdfViewer && (
        <PDFViewer
          filePath={pdfViewer.filePath}
          fileName={pdfViewer.fileName}
          isOpen={!!pdfViewer}
          onClose={() => setPdfViewer(null)}
        />
      )}
    </>
  )
}
