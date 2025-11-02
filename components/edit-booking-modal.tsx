"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { editBooking } from "@/app/actions/bookings"
import { BulkDatePicker } from "./bulk-date-picker"
import { SimpleDateTimePicker } from "./simple-date-time-picker"
import { FileText, Upload, AlertCircle, Loader2 } from "lucide-react"

interface Classroom {
  id: string
  name: string
  capacity: number
}

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
  classroom: { id: string; name: string; capacity: number }
}

interface EditBookingModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
  classrooms: Classroom[]
  onSuccess?: () => void
}

export function EditBookingModal({ booking, isOpen, onClose, classrooms, onSuccess }: EditBookingModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isBulkBooking, setIsBulkBooking] = useState(false)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [ecaaInstructorApproval, setEcaaInstructorApproval] = useState("true")
  const [fileErrors, setFileErrors] = useState({ ecaa: "", trainingOrder: "" })

  if (!booking) return null

  // Extract bulk booking info if applicable
  const isBulkBookingExisting = booking.purpose.startsWith("BULK_BOOKING:")
  const getBulkBookingDates = (): string[] => {
    if (!isBulkBookingExisting) return []
    const parts = booking.purpose.split(":")
    if (parts.length < 3) return []
    return parts[1].split(",")
  }

  const getDisplayPurpose = (): string => {
    if (isBulkBookingExisting) {
      const parts = booking.purpose.split(":")
      return parts.length >= 3 ? parts[2] : ""
    }
    return booking.purpose
  }

  const generateTimeOptions = () => {
    const times = []
    for (let hour = 7; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time24 = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        const ampm = hour >= 12 ? "PM" : "AM"
        const time12 = `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`
        times.push({ value: time24, label: time12 })
      }
    }
    return times
  }

  const timeOptions = generateTimeOptions()

  const getEndTimeOptions = () => {
    if (!startTime) return timeOptions
    const startIndex = timeOptions.findIndex((option) => option.value === startTime)
    if (startIndex === -1) return timeOptions
    return timeOptions.slice(startIndex + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (isBulkBooking) {
        if (selectedDates.length === 0) {
          setError("Please select at least one date for bulk booking")
          setIsLoading(false)
          return
        }
      } else {
        if (!selectedDate) {
          setError("Please select a date")
          setIsLoading(false)
          return
        }
        if (!startTime) {
          setError("Please select a start time")
          setIsLoading(false)
          return
        }
        if (!endTime) {
          setError("Please select an end time")
          setIsLoading(false)
          return
        }
      }

      const formData = new FormData(e.target as HTMLFormElement)
      formData.set("isBulkBooking", isBulkBooking.toString())

      if (!isBulkBooking && selectedDate && startTime && endTime) {
        formData.set("startTime", `${selectedDate}T${startTime}:00`)
        formData.set("endTime", `${selectedDate}T${endTime}:00`)
      }

      if (isBulkBooking && selectedDates.length > 0) {
        selectedDates.forEach((date) => {
          formData.append("selectedDates", date)
        })
        formData.set("startTime", `2000-01-01T${startTime}:00`)
        formData.set("endTime", `2000-01-01T${endTime}:00`)
      }

      try {
        const result = await editBooking(booking.id, formData)

        if (result.success) {
          onClose()
          onSuccess?.()
        }
      } catch (serverError: any) {
        const errorMessage = serverError?.message || "Failed to update booking. Please try again."
        console.error("[v0] Edit booking error:", serverError)
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "ecaa" | "trainingOrder") => {
    const file = e.target.files?.[0]
    if (file && file.size > 10 * 1024 * 1024) {
      setFileErrors((prevErrors) => ({
        ...prevErrors,
        [type]: "File size exceeds 10MB",
      }))
    } else {
      setFileErrors((prevErrors) => ({
        ...prevErrors,
        [type]: "",
      }))
    }
  }

  const calculateDuration = () => {
    if (!startTime || !endTime) return ""
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    const durationMinutes = endMinutes - startMinutes
    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60

    if (hours === 0) {
      return `${minutes} minutes`
    } else if (minutes === 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`
    } else {
      return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minutes`
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Update your booking details. Your request will be pending approval after editing.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <Label htmlFor="classroomId" className="text-base font-semibold text-blue-800">
                Select Classroom *
              </Label>
              <Select name="classroomId" defaultValue={booking.classroom.id}>
                <SelectTrigger className="h-12 bg-white">
                  <SelectValue placeholder="Choose your classroom" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((classroom) => (
                    <SelectItem key={classroom.id} value={classroom.id}>
                      <div className="flex flex-col items-start py-1">
                        <span className="font-medium">{classroom.name}</span>
                        <span className="text-sm text-gray-500">Capacity: {classroom.capacity} people</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Booking Type</Label>
              <RadioGroup
                defaultValue={isBulkBookingExisting ? "bulk" : "single"}
                onValueChange={(value) => {
                  setIsBulkBooking(value === "bulk")
                  setSelectedDate("")
                  setStartTime("")
                  setEndTime("")
                  setSelectedDates(isBulkBookingExisting ? getBulkBookingDates() : [])
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single">Single Booking</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bulk" id="bulk" />
                  <Label htmlFor="bulk">Bulk Booking (Multiple Dates)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              {isBulkBooking ? (
                <div className="space-y-3">
                  <Label>Select Multiple Dates *</Label>
                  <BulkDatePicker
                    selectedDates={selectedDates.length > 0 ? selectedDates : getBulkBookingDates()}
                    onSelectedDatesChange={setSelectedDates}
                  />

                  {(selectedDates.length > 0 || getBulkBookingDates().length > 0) && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <Label className="text-sm font-medium text-green-800">
                        Selected Dates ({selectedDates.length > 0 ? selectedDates.length : getBulkBookingDates().length}
                        )
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                        {(selectedDates.length > 0 ? selectedDates : getBulkBookingDates()).map((dateStr) => (
                          <div
                            key={dateStr}
                            className="bg-white p-2 rounded border border-green-300 text-sm font-medium"
                          >
                            {new Date(dateStr).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Label htmlFor="date">Date *</Label>
                  <SimpleDateTimePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    dateOnly={true}
                    defaultDate={booking.startTime}
                  />
                  <input
                    type="hidden"
                    name="startTime"
                    value={selectedDate && startTime ? `${selectedDate}T${startTime}:00` : ""}
                  />
                  <input
                    type="hidden"
                    name="endTime"
                    value={selectedDate && endTime ? `${selectedDate}T${endTime}:00` : ""}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="startTime">Start Time *</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="endTime">End Time *</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {getEndTimeOptions().map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {startTime && endTime && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Duration:</strong> {calculateDuration()}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="department">Department *</Label>
              <Select name="department" defaultValue={booking.department}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cockpit Training">Cockpit Training</SelectItem>
                  <SelectItem value="Cabin Crew">Cabin Crew</SelectItem>
                  <SelectItem value="Station">Station</SelectItem>
                  <SelectItem value="OCC">OCC</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Planning & Engineering">Planning & Engineering</SelectItem>
                  <SelectItem value="HR & Financial">HR & Financial</SelectItem>
                  <SelectItem value="Commercial & Planning">Commercial & Planning</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Meetings">Meetings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="participants">Number of Participants *</Label>
                <Input
                  id="participants"
                  name="participants"
                  type="number"
                  min="1"
                  defaultValue={booking.participants}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="instructorName">Instructor Name *</Label>
                <Input id="instructorName" name="instructorName" defaultValue={booking.instructorName} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="trainingOrder">Training Order *</Label>
                <Input id="trainingOrder" name="trainingOrder" defaultValue={booking.trainingOrder} required />
              </div>

              <div className="space-y-3">
                <Label htmlFor="courseReference">Course Reference</Label>
                <Input
                  id="courseReference"
                  name="courseReference"
                  defaultValue={booking.courseReference || ""}
                  placeholder="Enter course reference (optional)"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="purpose">Course Title *</Label>
              <Textarea
                id="purpose"
                name="purpose"
                defaultValue={getDisplayPurpose()}
                required
                placeholder="Enter the course title"
                rows={3}
              />
            </div>

            <div className="space-y-4 bg-purple-50 p-4 rounded-lg border border-purple-200">
              <Label className="text-sm font-medium text-gray-700">ECAA Instructor Approval Status *</Label>
              <RadioGroup
                name="ecaaInstructorApproval"
                defaultValue={booking.ecaaInstructorApproval ? "true" : "false"}
                onValueChange={setEcaaInstructorApproval}
                className="flex flex-col space-y-2"
                required
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="ecaa-yes" />
                  <Label htmlFor="ecaa-yes" className="text-sm">
                    Yes, I have ECAA instructor approval
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="ecaa-no" />
                  <Label htmlFor="ecaa-no" className="text-sm">
                    No, I don't have ECAA instructor approval
                  </Label>
                </div>
              </RadioGroup>

              {ecaaInstructorApproval === "true" && (
                <div className="space-y-4 mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="space-y-2">
                    <Label htmlFor="ecaaApprovalNumber" className="text-sm font-medium text-gray-700">
                      ECAA Approval Number *
                    </Label>
                    <Input
                      id="ecaaApprovalNumber"
                      name="ecaaApprovalNumber"
                      defaultValue={booking.ecaaApprovalNumber || ""}
                      placeholder="Enter your ECAA approval number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="ecaaApprovalFile"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      ECAA Approval PDF (Optional - leave empty to keep existing)
                    </Label>
                    <div className="relative">
                      <Input
                        id="ecaaApprovalFile"
                        name="ecaaApprovalFile"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, "ecaa")}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    {fileErrors.ecaa && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {fileErrors.ecaa}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {ecaaInstructorApproval === "false" && (
                <div className="space-y-2 mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <Label htmlFor="qualifications" className="text-sm font-medium text-gray-700">
                    Your Qualifications *
                  </Label>
                  <Textarea
                    id="qualifications"
                    name="qualifications"
                    defaultValue={booking.qualifications || ""}
                    placeholder="Please describe your relevant qualifications and experience"
                    className="min-h-[80px] resize-none"
                    required
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="trainingOrderFile">Training Order PDF (Optional - leave empty to keep existing)</Label>
              <div className="relative">
                <Input
                  id="trainingOrderFile"
                  name="trainingOrderFile"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, "trainingOrder")}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              {fileErrors.trainingOrder && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {fileErrors.trainingOrder}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Booking"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
