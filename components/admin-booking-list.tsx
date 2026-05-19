"use client"

import { updateBookingStatus, deleteBooking } from "@/app/actions/bookings"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Check, Clock, Eye, FileText, MapPin, Trash2, User, X, CalendarDays, Building2 } from "lucide-react"
import { useState } from "react"
import { BookingDetailsModal } from "./booking-details-modal"

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
  department?: string
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

interface AdminBookingListProps {
  bookings: Booking[]
  showActions: boolean
}

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED"

const statusFilters: StatusFilter[] = ["ALL", "PENDING", "APPROVED", "REJECTED"]

export function AdminBookingList({ bookings, showActions }: AdminBookingListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string; id: string } | null>(null)

  const visibleBookings =
    showActions || statusFilter === "ALL" ? bookings : bookings.filter((booking) => booking.status === statusFilter)

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

  const isBulkBooking = (purpose: string) => {
    return purpose.startsWith("BULK_BOOKING:")
  }

  const getBulkBookingInfo = (purpose: string) => {
    if (!isBulkBooking(purpose)) return null
    const [, datesStr, actualPurpose] = purpose.split(":", 3)
    const dates = datesStr.split(",")
    return { dates, actualPurpose }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleStatusUpdate = async (bookingId: string, status: "APPROVED" | "REJECTED") => {
    try {
      await updateBookingStatus(bookingId, status)
      setMessage({
        type: "success",
        text: `Booking ${status.toLowerCase()} successfully.`,
        id: bookingId,
      })

      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to update booking status.",
        id: bookingId,
      })
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    if (confirm("Are you sure you want to delete this booking?")) {
      setIsDeleting(bookingId)
      try {
        await deleteBooking(bookingId)
      } catch (error) {
        alert("Failed to delete booking")
        setIsDeleting(null)
      }
    }
  }

  if (bookings.length === 0) {
    return (
      <Card className="shadow-sm border bg-white">
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500">No bookings found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {!showActions && (
        <div className="mb-3 flex flex-wrap gap-2">
          {statusFilters.map((filter) => {
            const count = filter === "ALL" ? bookings.length : bookings.filter((booking) => booking.status === filter).length

            return (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={statusFilter === filter ? "default" : "outline"}
                onClick={() => setStatusFilter(filter)}
                className={statusFilter === filter ? "bg-purple-600 hover:bg-purple-700" : "bg-white"}
              >
                {filter === "ALL" ? "All" : filter.charAt(0) + filter.slice(1).toLowerCase()}
                <span className="ml-2 rounded-full bg-white/20 px-1.5 text-xs">{count}</span>
              </Button>
            )
          })}
        </div>
      )}

      {visibleBookings.length === 0 ? (
        <Card className="shadow-sm border bg-white">
          <CardContent className="p-6 text-center text-gray-500">No bookings match this filter.</CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="hidden lg:grid grid-cols-[1.2fr_1fr_1.1fr_1.3fr_auto] gap-4 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <span>Classroom</span>
            <span>Requester</span>
            <span>Date and Time</span>
            <span>Purpose</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-gray-100">
            {visibleBookings.map((booking) => {
              const bulkInfo = getBulkBookingInfo(booking.purpose)
              const displayPurpose = bulkInfo ? bulkInfo.actualPurpose : booking.purpose
              const previewDates = bulkInfo?.dates.slice(0, 3) ?? []

              return (
                <div
                  key={booking.id}
                  className={`grid gap-3 px-4 py-4 lg:grid-cols-[1.2fr_1fr_1.1fr_1.3fr_auto] lg:items-center ${
                    isDeleting === booking.id ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="truncate font-medium text-gray-900">{booking.classroom.name}</span>
                      <Badge className={`${getStatusColor(booking.status)} border text-xs`}>{booking.status}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>{booking.participants} participants</span>
                      {booking.department && (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {booking.department}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="truncate font-medium">{booking.user.name || booking.user.email}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-700">
                    {bulkInfo ? (
                      <>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-400" />
                          <span>Bulk, {bulkInfo.dates.length} dates</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {previewDates.map((date) => (
                            <span key={date} className="rounded border bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                              {formatDate(new Date(date))}
                            </span>
                          ))}
                          {bulkInfo.dates.length > previewDates.length && (
                            <span className="rounded border bg-gray-50 px-1.5 py-0.5 text-xs text-gray-600">
                              +{bulkInfo.dates.length - previewDates.length}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(booking.startTime)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <span className="line-clamp-2">{displayPurpose}</span>
                    </div>
                    {message && message.id === booking.id && (
                      <p className={message.type === "success" ? "mt-2 text-xs text-green-700" : "mt-2 text-xs text-red-700"}>
                        {message.text}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button size="sm" variant="outline" onClick={() => setSelectedBooking(booking)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>

                    {showActions && booking.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(booking.id, "APPROVED")}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(booking.id, "REJECTED")}>
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {selectedBooking && (
        <BookingDetailsModal booking={selectedBooking} isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </>
  )
}
