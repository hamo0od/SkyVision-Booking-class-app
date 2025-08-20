"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { updateBookingStatus, cancelBooking, deleteBooking } from "@/app/actions/bookings"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Calendar, FileText, User, MapPin, CheckCircle, XCircle, Eye } from "lucide-react"
import { PdfViewer } from "./pdf-viewer"

interface Booking {
  id: string
  startTime: Date
  endTime: Date
  purpose: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  participants: number
  instructorName: string
  trainingOrder: string
  courseReference?: string | null
  department: string
  ecaaInstructorApproval: boolean
  ecaaApprovalNumber?: string | null
  qualifications?: string | null
  ecaaApprovalFile?: string | null
  trainingOrderFile?: string | null
  bulkBookingId?: string | null
  user?: {
    id: string
    name?: string | null
    email: string
  } | null
  classroom: {
    id: string
    name: string
    capacity: number
    description?: string | null
  }
}

interface BookingDetailsModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
  isAdmin?: boolean
  onBookingUpdate?: () => void
}

export function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  isAdmin = false,
  onBookingUpdate,
}: BookingDetailsModalProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string>("")
  const [pdfTitle, setPdfTitle] = useState<string>("")
  const { toast } = useToast()

  if (!booking) return null

  const handleStatusUpdate = async (status: "APPROVED" | "REJECTED") => {
    setIsUpdating(true)
    try {
      await updateBookingStatus(booking.id, status)
      toast({
        title: "Success",
        description: `Booking ${status.toLowerCase()} successfully`,
      })
      onBookingUpdate?.()
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update booking",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = async () => {
    setIsUpdating(true)
    try {
      await cancelBooking(booking.id)
      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      })
      onBookingUpdate?.()
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel booking",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
      return
    }

    setIsUpdating(true)
    try {
      await deleteBooking(booking.id)
      toast({
        title: "Success",
        description: "Booking deleted successfully",
      })
      onBookingUpdate?.()
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete booking",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleViewPdf = (fileUrl: string, title: string) => {
    setPdfUrl(fileUrl)
    setPdfTitle(title)
    setShowPdfViewer(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
    }
  }

  // Check if this is a bulk booking
  const isBulkBooking = booking.purpose.startsWith("BULK_BOOKING:")
  let displayPurpose = booking.purpose
  let bulkDates: string[] = []

  if (isBulkBooking) {
    const parts = booking.purpose.split(":", 3)
    if (parts.length === 3) {
      bulkDates = parts[1].split(",")
      displayPurpose = parts[2]
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-5 w-5 text-blue-600" />
              Booking Details
              {isBulkBooking && (
                <Badge variant="outline" className="ml-2">
                  Bulk ({bulkDates.length} dates)
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusBadge(booking.status)}
                {booking.bulkBookingId && (
                  <Badge variant="outline" className="text-purple-700 border-purple-200">
                    ID: {booking.bulkBookingId}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                {isAdmin && booking.status === "PENDING" && (
                  <>
                    <Button
                      onClick={() => handleStatusUpdate("APPROVED")}
                      disabled={isUpdating}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate("REJECTED")}
                      disabled={isUpdating}
                      variant="destructive"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}

                {!isAdmin && booking.status === "PENDING" && (
                  <Button onClick={handleCancel} disabled={isUpdating} variant="outline" size="sm">
                    Cancel Booking
                  </Button>
                )}

                {isAdmin && (
                  <Button onClick={handleDelete} disabled={isUpdating} variant="destructive" size="sm">
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {/* User Information */}
            {isAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-600">Requested By</label>
                  <p className="text-gray-900">{booking.user?.name || booking.user?.email || "Unknown User"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{booking.user?.email || "No email available"}</p>
                </div>
              </div>
            )}

            {/* Booking Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date and Time */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date & Time
                </h3>

                {isBulkBooking ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Selected Dates</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {bulkDates.map((dateStr, index) => (
                          <div key={index} className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-sm">
                            {format(new Date(dateStr), "MMM d, yyyy")}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Start Time</label>
                        <p className="text-gray-900">{format(booking.startTime, "h:mm a")}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">End Time</label>
                        <p className="text-gray-900">{format(booking.endTime, "h:mm a")}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date</label>
                      <p className="text-gray-900">{format(booking.startTime, "EEEE, MMMM d, yyyy")}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Start Time</label>
                        <p className="text-gray-900">{format(booking.startTime, "h:mm a")}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">End Time</label>
                        <p className="text-gray-900">{format(booking.endTime, "h:mm a")}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Classroom Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Classroom
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Room</label>
                    <p className="text-gray-900">{booking.classroom.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Capacity</label>
                    <p className="text-gray-900">{booking.classroom.capacity} people</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Participants</label>
                    <p className="text-gray-900">{booking.participants} people</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Course Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Course Title</label>
                  <p className="text-gray-900">{displayPurpose}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Department</label>
                  <p className="text-gray-900">{booking.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Instructor</label>
                  <p className="text-gray-900">{booking.instructorName}</p>
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

            {/* ECAA Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                ECAA Instructor Approval
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Has ECAA Approval</label>
                  <p className="text-gray-900">{booking.ecaaInstructorApproval ? "Yes" : "No"}</p>
                </div>
                {booking.ecaaInstructorApproval && booking.ecaaApprovalNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Approval Number</label>
                    <p className="text-gray-900">{booking.ecaaApprovalNumber}</p>
                  </div>
                )}
                {!booking.ecaaInstructorApproval && booking.qualifications && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">Qualifications</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{booking.qualifications}</p>
                  </div>
                )}
              </div>
            </div>

            {/* File Attachments */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Attachments
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {booking.ecaaApprovalFile && (
                  <div className="p-3 border rounded-lg">
                    <label className="text-sm font-medium text-gray-600">ECAA Approval Document</label>
                    <div className="mt-2">
                      <Button
                        onClick={() => handleViewPdf(booking.ecaaApprovalFile!, "ECAA Approval Document")}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View PDF
                      </Button>
                    </div>
                  </div>
                )}
                {booking.trainingOrderFile && (
                  <div className="p-3 border rounded-lg">
                    <label className="text-sm font-medium text-gray-600">Training Order Document</label>
                    <div className="mt-2">
                      <Button
                        onClick={() => handleViewPdf(booking.trainingOrderFile!, "Training Order Document")}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View PDF
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal */}
      <PdfViewer isOpen={showPdfViewer} onClose={() => setShowPdfViewer(false)} pdfUrl={pdfUrl} title={pdfTitle} />
    </>
  )
}
