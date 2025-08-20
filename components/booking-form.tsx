"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createBooking } from "@/app/actions/bookings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SimpleDateTimePicker } from "./simple-date-time-picker"
import { BulkDatePicker } from "./bulk-date-picker"
import { Calendar, Clock, Users, FileText, Upload, AlertCircle, CalendarDays, Building2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Classroom {
  id: string
  name: string
  capacity: number
  description?: string
}

interface BookingFormProps {
  classrooms: Classroom[]
}

const DEPARTMENTS = [
  "Cockpit Training",
  "Cabin Crew",
  "Station",
  "OCC",
  "Compliance",
  "Safety",
  "Security",
  "Maintenance",
  "Planning & Engineering",
  "HR & Financial",
  "Commercial & Planning",
  "IT",
  "Meetings",
]

export function BookingForm({ classrooms }: BookingFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedClassroom, setSelectedClassroom] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)
  const [ecaaInstructorApproval, setEcaaInstructorApproval] = useState<string>("")
  const [isBulkBooking, setIsBulkBooking] = useState(false)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [bulkStartTime, setBulkStartTime] = useState<Date | null>(null)
  const [bulkEndTime, setBulkEndTime] = useState<Date | null>(null)
  const [fileErrors, setFileErrors] = useState<{ ecaa?: string; training?: string }>({})

  // Reset time fields when bulk booking mode changes
  useEffect(() => {
    if (isBulkBooking) {
      // Reset single booking fields
      setSelectedDate(null)
      setStartTime(null)
      setEndTime(null)

      // Set default time for bulk booking (9 AM - 10 AM)
      const defaultStart = new Date()
      defaultStart.setHours(9, 0, 0, 0)
      const defaultEnd = new Date()
      defaultEnd.setHours(10, 0, 0, 0)
      setBulkStartTime(defaultStart)
      setBulkEndTime(defaultEnd)
    } else {
      // Reset bulk booking fields
      setSelectedDates([])
      setBulkStartTime(null)
      setBulkEndTime(null)
    }
  }, [isBulkBooking])

  // Update end time when start time changes (for single booking)
  useEffect(() => {
    if (startTime && !isBulkBooking) {
      const newEndTime = new Date(startTime)
      newEndTime.setHours(startTime.getHours() + 1, startTime.getMinutes(), 0, 0)
      setEndTime(newEndTime)
    }
  }, [startTime, isBulkBooking])

  // Update bulk end time when bulk start time changes
  useEffect(() => {
    if (bulkStartTime && isBulkBooking) {
      const newEndTime = new Date(bulkStartTime)
      newEndTime.setHours(bulkStartTime.getHours() + 1, bulkStartTime.getMinutes(), 0, 0)
      setBulkEndTime(newEndTime)
    }
  }, [bulkStartTime, isBulkBooking])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fileType: "ecaa" | "training") => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setFileErrors((prev) => ({
          ...prev,
          [fileType]: "File size must be less than 10MB",
        }))
        // Clear the file input
        event.target.value = ""
        return
      }

      // Check file type
      if (file.type !== "application/pdf") {
        setFileErrors((prev) => ({
          ...prev,
          [fileType]: "Only PDF files are allowed",
        }))
        // Clear the file input
        event.target.value = ""
        return
      }

      // Clear any previous errors for this file type
      setFileErrors((prev) => ({
        ...prev,
        [fileType]: undefined,
      }))
    }
  }

  const getDuration = () => {
    const start = isBulkBooking ? bulkStartTime : startTime
    const end = isBulkBooking ? bulkEndTime : endTime

    if (!start || !end) return ""
    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const hours = Math.floor(diffHours)
    const minutes = Math.round((diffHours - hours) * 60)
    return `${hours}h ${minutes}m`
  }

  const getMinEndTime = () => {
    const start = isBulkBooking ? bulkStartTime : startTime
    if (!start) return undefined
    const minEnd = new Date(start)
    minEnd.setMinutes(minEnd.getMinutes() + 30) // Minimum 30 minutes
    return minEnd.toTimeString().slice(0, 5)
  }

  const removeBulkDate = (dateToRemove: string) => {
    const newDates = selectedDates.filter((date) => date !== dateToRemove)
    setSelectedDates(newDates)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)

      // Add bulk booking data
      formData.set("isBulkBooking", isBulkBooking.toString())
      if (isBulkBooking) {
        selectedDates.forEach((date) => {
          formData.append("selectedDates", date)
        })
        // Add bulk booking times
        if (bulkStartTime) formData.set("startTime", bulkStartTime.toISOString())
        if (bulkEndTime) formData.set("endTime", bulkEndTime.toISOString())
      } else {
        // Add single booking times
        if (startTime) formData.set("startTime", startTime.toISOString())
        if (endTime) formData.set("endTime", endTime.toISOString())
      }

      const result = await createBooking(formData)

      if (result.success) {
        toast({
          title: "Success!",
          description: result.message,
        })

        // Reset form
        const form = event.currentTarget
        form.reset()
        setSelectedClassroom("")
        setSelectedDate(null)
        setStartTime(null)
        setEndTime(null)
        setBulkStartTime(null)
        setBulkEndTime(null)
        setEcaaInstructorApproval("")
        setIsBulkBooking(false)
        setSelectedDates([])
        setFileErrors({})
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create booking",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedClassroomData = classrooms.find((c) => c.id === selectedClassroom)

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          Book a Classroom
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bulk Booking Toggle */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="bulkBooking"
                checked={isBulkBooking}
                onChange={(e) => setIsBulkBooking(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="bulkBooking" className="flex items-center gap-2 font-medium text-blue-900">
                <CalendarDays className="h-4 w-4" />
                Bulk Booking (Multiple Dates)
              </Label>
            </div>
            {isBulkBooking && (
              <p className="text-sm text-blue-700 mt-2">
                Select multiple dates for the same time slot and session details.
              </p>
            )}
          </div>

          {/* Classroom Selection */}
          <div className="space-y-2">
            <Label htmlFor="classroomId" className="text-sm font-medium text-gray-700">
              Classroom *
            </Label>
            <Select name="classroomId" value={selectedClassroom} onValueChange={setSelectedClassroom} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a classroom" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.name} (Capacity: {classroom.capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClassroomData?.description && (
              <p className="text-sm text-gray-600">{selectedClassroomData.description}</p>
            )}
          </div>

          {/* Department Selection */}
          <div className="space-y-2">
            <Label htmlFor="department" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Department *
            </Label>
            <Select name="department" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time Selection - Single Booking */}
          {!isBulkBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SimpleDateTimePicker
                  label="Start Date & Time"
                  icon={<Calendar className="h-4 w-4" />}
                  value={startTime}
                  onChange={setStartTime}
                  name="startTime"
                  required
                />
                <SimpleDateTimePicker
                  label="End Date & Time"
                  icon={<Clock className="h-4 w-4" />}
                  value={endTime}
                  onChange={setEndTime}
                  name="endTime"
                  minTime={getMinEndTime()}
                  required
                />
              </div>
            </div>
          )}

          {/* Date and Time Selection - Bulk Booking */}
          {isBulkBooking && (
            <div className="space-y-4">
              {/* Bulk Date Selection */}
              <BulkDatePicker selectedDates={selectedDates} onSelectedDatesChange={setSelectedDates} />

              {/* Selected Dates Display */}
              {selectedDates.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Selected Dates:</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedDates.map((dateStr) => (
                      <div
                        key={dateStr}
                        className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm"
                      >
                        <span>
                          {new Date(dateStr).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeBulkDate(dateStr)}
                          className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bulk Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SimpleDateTimePicker
                  label="Start Time"
                  icon={<Clock className="h-4 w-4" />}
                  value={bulkStartTime}
                  onChange={setBulkStartTime}
                  timeOnly={true}
                  required
                />
                <SimpleDateTimePicker
                  label="End Time"
                  icon={<Clock className="h-4 w-4" />}
                  value={bulkEndTime}
                  onChange={setBulkEndTime}
                  timeOnly={true}
                  minTime={getMinEndTime()}
                  required
                />
              </div>
            </div>
          )}

          {/* Duration Display */}
          {((startTime && endTime && !isBulkBooking) || (bulkStartTime && bulkEndTime && isBulkBooking)) && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Duration:</strong> {getDuration()}
                {isBulkBooking && selectedDates.length > 0 && (
                  <span className="ml-2">
                    • <strong>{selectedDates.length} dates selected</strong>
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Course Title */}
          <div className="space-y-2">
            <Label htmlFor="purpose" className="text-sm font-medium text-gray-700">
              Course Title *
            </Label>
            <Textarea
              id="purpose"
              name="purpose"
              placeholder="Enter the course title or training purpose"
              className="min-h-[80px] resize-none"
              required
            />
          </div>

          {/* Training Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instructorName" className="text-sm font-medium text-gray-700">
                Instructor Name *
              </Label>
              <Input id="instructorName" name="instructorName" placeholder="Enter instructor's full name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participants" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of Participants *
              </Label>
              <Input
                id="participants"
                name="participants"
                type="number"
                min="1"
                max={selectedClassroomData?.capacity || 100}
                placeholder="Enter number of participants"
                required
              />
              {selectedClassroomData && (
                <p className="text-xs text-gray-500">Maximum capacity: {selectedClassroomData.capacity}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trainingOrder" className="text-sm font-medium text-gray-700">
                Training Order *
              </Label>
              <Input id="trainingOrder" name="trainingOrder" placeholder="Enter training order number" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseReference" className="text-sm font-medium text-gray-700">
                Course Reference
              </Label>
              <Input id="courseReference" name="courseReference" placeholder="Enter course reference (optional)" />
            </div>
          </div>

          {/* ECAA Instructor Approval */}
          <div className="space-y-4 bg-purple-50 p-4 rounded-lg border border-purple-200">
            <Label className="text-sm font-medium text-gray-700">ECAA Instructor Approval Status *</Label>
            <RadioGroup
              name="ecaaInstructorApproval"
              value={ecaaInstructorApproval}
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
                    ECAA Approval PDF *
                  </Label>
                  <div className="relative">
                    <Input
                      id="ecaaApprovalFile"
                      name="ecaaApprovalFile"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "ecaa")}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required
                    />
                    <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  {fileErrors.ecaa && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {fileErrors.ecaa}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Upload your ECAA approval document (PDF only, max 10MB)</p>
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
                  placeholder="Please describe your relevant qualifications and experience"
                  className="min-h-[80px] resize-none"
                  required
                />
              </div>
            )}
          </div>

          {/* Training Order File Upload */}
          <div className="space-y-2">
            <Label htmlFor="trainingOrderFile" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Training Order PDF *
            </Label>
            <div className="relative">
              <Input
                id="trainingOrderFile"
                name="trainingOrderFile"
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileChange(e, "training")}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                required
              />
              <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {fileErrors.training && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {fileErrors.training}
              </div>
            )}
            <p className="text-xs text-gray-500">Upload your training order document (PDF only, max 10MB)</p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              Object.values(fileErrors).some(Boolean) ||
              (isBulkBooking && (selectedDates.length === 0 || !bulkStartTime || !bulkEndTime)) ||
              (!isBulkBooking && (!startTime || !endTime))
            }
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {isBulkBooking ? "Creating Bulk Booking..." : "Creating Booking..."}
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                {isBulkBooking ? "Submit Bulk Booking Request" : "Submit Booking Request"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
