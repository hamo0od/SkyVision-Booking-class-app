"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PdfViewer } from "./pdf-viewer"
import { Calendar, Clock, MapPin, Users, User, Building, FileText, Award, GraduationCap, X } from "lucide-react"

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
  ecaaInstructorApproval: boolean
  ecaaApprovalNumber: string | null
  qualifications: string | null
  ecaaApprovalFile: string | null
  trainingOrderFile: string | null
  bulkBookingId: string | null
  createdAt: Date
  classroom: {
    id: string
    name: string
    capacity: number
    location: string
  }
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface BookingDetailsModalProps {
  booking: Booking | null
  onClose: () => void
}

export function BookingDetailsModal({ booking, onClose }: BookingDetailsModalProps) {
  if (!booking) return null

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

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const extractBulkBookingInfo = (booking: Booking) => {
    if (!booking.purpose.startsWith("BULK_BOOKING:")) {
      return { isBulk: false, dates: [], courseTitle: booking.purpose }
    }

    const parts = booking.purpose.split(":")
    if (parts.length < 3) {
      return { isBulk: true, dates: [], courseTitle: booking.purpose }
    }

    const dates = parts[1].split(",")
    const courseTitle = parts.slice(2).join(":")

    return { isBulk: true, dates, courseTitle }
  }

  const bulkInfo = extractBulkBookingInfo(booking)

  return (
    <Dialog open={!!booking} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Booking Details</DialogTitle>
            <Badge className={getStatusColor(booking.status)}>{booking.status.toUpperCase()}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Course Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Course Title</label>
                <p className="text-sm text-gray-900 mt-1">{bulkInfo.isBulk ? bulkInfo.courseTitle : booking.purpose}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Instructor Name</label>
                <p className="text-sm text-gray-900 mt-1">{booking.instructorName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Training Order</label>
                <p className="text-sm text-gray-900 mt-1">{booking.trainingOrder}</p>
              </div>
              {booking.courseReference && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Course Reference</label>
                  <p className="text-sm text-gray-900 mt-1">{booking.courseReference}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Booking Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-600">Classroom</label>
                  <p className="text-sm text-gray-900">{booking.classroom.name}</p>
                  <p className="text-xs text-gray-500">Capacity: {booking.classroom.capacity} people</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-600">Participants</label>
                  <p className="text-sm text-gray-900">{booking.participants} people</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-600">Department</label>
                  <p className="text-sm text-gray-900">{booking.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-600">Requested by</label>
                  <p className="text-sm text-gray-900">{booking.user.name || booking.user.email}</p>
                </div>
              </div>
            </div>

            {/* Date and Time Information */}
            {bulkInfo.isBulk ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Time for All Dates</label>
                    <p className="text-sm text-gray-900">
                      {new Date(booking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                      {new Date(booking.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Bulk Booking Dates:</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {bulkInfo.dates.map((dateStr, index) => (
                      <Badge key={index} variant="outline" className="justify-center">
                        {new Date(dateStr).toLocaleDateString()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Date & Time</label>
                    <p className="text-sm text-gray-900">{formatDateTime(booking.startTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">End Date & Time</label>
                    <p className="text-sm text-gray-900">{formatDateTime(booking.endTime)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* ECAA Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5" />
              ECAA Instructor Approval
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">ECAA Approval Status</label>
                <p className="text-sm text-gray-900 mt-1">
                  {booking.ecaaInstructorApproval ? "Yes, has ECAA approval" : "No ECAA approval"}
                </p>
              </div>
              {booking.ecaaInstructorApproval && booking.ecaaApprovalNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-600">ECAA Approval Number</label>
                  <p className="text-sm text-gray-900 mt-1">{booking.ecaaApprovalNumber}</p>
                </div>
              )}
            </div>
            {!booking.ecaaInstructorApproval && booking.qualifications && (
              <div>
                <label className="text-sm font-medium text-gray-600">Qualifications</label>
                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{booking.qualifications}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {booking.trainingOrderFile && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Training Order Document</label>
                  <div className="border rounded-lg p-3">
                    <PdfViewer filePath={booking.trainingOrderFile} title="Training Order" />
                  </div>
                </div>
              )}
              {booking.ecaaApprovalFile && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">ECAA Approval Document</label>
                  <div className="border rounded-lg p-3">
                    <PdfViewer filePath={booking.ecaaApprovalFile} title="ECAA Approval" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Submission Info */}
          <div className="text-sm text-gray-600">
            <p>
              <span className="font-medium">Submitted:</span>{" "}
              {new Date(booking.createdAt).toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>
              <span className="font-medium">Booking ID:</span> {booking.id}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
