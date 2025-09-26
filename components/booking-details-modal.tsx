"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users, FileText, Building2, X } from "lucide-react"
import { PDFViewer } from "./pdf-viewer"

interface Booking {
  id: string
  classroom_name: string
  date: string
  start_time: string
  end_time: string
  purpose: string
  participants: number
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
  created_at: string
  file_path?: string
  department: string
}

interface BookingDetailsModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
}

export function BookingDetailsModal({ booking, isOpen, onClose }: BookingDetailsModalProps) {
  // Early return if booking is null
  if (!booking) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
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

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "CANCELLED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const extractCourseTitle = (purpose: string) => {
    if (purpose.includes("BULK_BOOKING:")) {
      const parts = purpose.split(" - ")
      return parts.length > 1 ? parts.slice(1).join(" - ") : purpose
    }
    return purpose
  }

  const isBulkBooking = booking.purpose.includes("BULK_BOOKING:")
  const bulkDates = isBulkBooking
    ? booking.purpose
        .split("BULK_BOOKING:")[1]
        .split(" - ")[0]
        .split(",")
        .map((d) => d.trim())
    : []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-semibold pr-8">Booking Details</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Type */}
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
            {isBulkBooking && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Bulk Booking ({bulkDates.length} dates)
              </Badge>
            )}
          </div>

          {/* Course Title */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{extractCourseTitle(booking.purpose)}</h3>
          </div>

          {/* Booking Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Date</p>
                  <p className="text-sm text-gray-600">{formatDate(booking.date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Time</p>
                  <p className="text-sm text-gray-600">
                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Classroom</p>
                  <p className="text-sm text-gray-600">{booking.classroom_name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Participants</p>
                  <p className="text-sm text-gray-600">{booking.participants} people</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Department</p>
                  <p className="text-sm text-gray-600">{booking.department}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Submitted</p>
                  <p className="text-sm text-gray-600">
                    {new Date(booking.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Booking Dates */}
          {isBulkBooking && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                All Booking Dates:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {bulkDates.map((date, index) => (
                  <div
                    key={index}
                    className="bg-white rounded px-3 py-2 text-sm font-medium text-blue-700 border border-blue-200"
                  >
                    {new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                ))}
              </div>
              <p className="text-sm text-blue-600 mt-2">
                Time: {formatTime(booking.start_time)} - {formatTime(booking.end_time)} for all dates
              </p>
            </div>
          )}

          {/* Attached File */}
          {booking.file_path && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Attached Document
              </h4>
              <PDFViewer filePath={`/uploads/${booking.file_path}`} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
