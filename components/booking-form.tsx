"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBooking } from "@/app/actions/bookings"
import { SimpleDateTimePicker } from "./simple-date-time-picker"
import { BulkDatePicker } from "./bulk-date-picker"
import { FileText, Upload, AlertCircle } from "lucide-react"

interface Classroom {
  id: string
  name: string
  capacity: number
}

interface BookingFormProps {
  classrooms: Classroom[]
}

export function BookingForm({ classrooms }: BookingFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isBulkBooking, setIsBulkBooking] = useState(false)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [ecaaInstructorApproval, setEcaaInstructorApproval] = useState("true")
  const [fileErrors, setFileErrors] = useState({ ecaa: "", trainingOrder: "" })

  // Generate time options (30-minute intervals from 7 AM to 11 PM)
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

  // Filter end time options based on start time
  const getEndTimeOptions = () => {
    if (!startTime) return timeOptions

    const startIndex = timeOptions.findIndex((option) => option.value === startTime)
    if (startIndex === -1) return timeOptions

    // End time must be at least 30 minutes after start time
    return timeOptions.slice(startIndex + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setIsSuccess(false)

    try {
      const formData = new FormData(e.target as HTMLFormElement)

      // Add bulk booking data
      formData.set("isBulkBooking", isBulkBooking.toString())
      if (isBulkBooking && selectedDates.length > 0) {
        selectedDates.forEach((date) => {
          formData.append("selectedDates", date)
        })
      }

      const result = await createBooking(formData)

      if (result.success) {
        setIsSuccess(true)
        // Reset form
        const form = e.target as HTMLFormElement
        form.reset()
        setSelectedDate("")
        setStartTime("")
        setEndTime("")
        setSelectedDates([])
        setIsBulkBooking(false)
        setEcaaInstructorApproval("true")
        setFileErrors({ ecaa: "", trainingOrder: "" })

        // Hide success message after 5 seconds
        setTimeout(() => {
          setIsSuccess(false)
        }, 5000)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkBookingChange = (value: string) => {
    const isBulk = value === "bulk"
    setIsBulkBooking(isBulk)

    // Reset date/time fields when switching modes
    setSelectedDate("")
    setStartTime("")
    setEndTime("")
    setSelectedDates([])
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book a Classroom</CardTitle>
        <CardDescription>Fill out the form below to request a classroom booking.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {isSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Booking submitted successfully! Your request is pending approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Booking Type Selection */}
          <div className="space-y-3">
            <Label>Booking Type</Label>
            <RadioGroup defaultValue="single" onValueChange={handleBulkBookingChange}>
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

          {/* Classroom Selection - Moved here */}
          <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <Label htmlFor="classroomId" className="text-base font-semibold text-blue-800">
              🏫 Select Classroom First *
            </Label>
            <Select name="classroomId">
              <SelectTrigger className="h-12 bg-white">
                <SelectValue placeholder="👆 Choose your classroom before proceeding" />
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
            <p className="text-xs text-blue-600">Select your preferred classroom before choosing dates and times.</p>
          </div>

          {/* Date Selection */}
          <div className="space-y-4">
            {isBulkBooking ? (
              <div className="space-y-3">
                <Label>Select Multiple Dates *</Label>
                <BulkDatePicker selectedDates={selectedDates} onSelectedDatesChange={setSelectedDates} />

                {/* Enhanced display of selected dates */}
                {selectedDates.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium text-green-800">
                        📅 Selected Dates ({selectedDates.length})
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDates([])}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedDates.map((dateStr, index) => (
                        <div
                          key={dateStr}
                          className="flex items-center justify-between bg-white p-2 rounded border border-green-300"
                        >
                          <span className="text-sm font-medium">
                            {new Date(dateStr).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newDates = selectedDates.filter((date) => date !== dateStr)
                              setSelectedDates(newDates)
                            }}
                            className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1"
                            title="Remove this date"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      💡 Click ✕ to remove individual dates, or "Clear All" to start over.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="date">Date *</Label>
                <SimpleDateTimePicker value={selectedDate} onChange={setSelectedDate} dateOnly={true} />
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

          {/* Time Selection */}
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
              {isBulkBooking && (
                <input
                  type="hidden"
                  name="startTime"
                  value={selectedDates.length > 0 && startTime ? `${selectedDates[0]}T${startTime}:00` : ""}
                />
              )}
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
              {isBulkBooking && (
                <input
                  type="hidden"
                  name="endTime"
                  value={selectedDates.length > 0 && endTime ? `${selectedDates[0]}T${endTime}:00` : ""}
                />
              )}
            </div>
          </div>

          {/* Duration Display */}
          {startTime && endTime && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                <strong>Duration:</strong> {calculateDuration()}
                {isBulkBooking && selectedDates.length > 0 && (
                  <span>
                    {" "}
                    • <strong>Dates:</strong> {selectedDates.length} selected
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Department Selection */}
          <div className="space-y-3">
            <Label htmlFor="department">Department *</Label>
            <Select name="department">
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

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="participants">Number of Participants *</Label>
              <Input
                id="participants"
                name="participants"
                type="number"
                min="1"
                required
                placeholder="Enter number of participants"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="instructorName">Instructor Name *</Label>
              <Input id="instructorName" name="instructorName" required placeholder="Enter instructor name" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="trainingOrder">Training Order *</Label>
              <Input id="trainingOrder" name="trainingOrder" required placeholder="Enter training order" />
            </div>

            <div className="space-y-3">
              <Label htmlFor="courseReference">Course Reference</Label>
              <Input id="courseReference" name="courseReference" placeholder="Enter course reference (optional)" />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="purpose">Purpose of Booking *</Label>
            <Textarea
              id="purpose"
              name="purpose"
              required
              placeholder="Describe the purpose of your booking"
              rows={3}
            />
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

          {/* File Uploads */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="trainingOrderFile">Training Order PDF *</Label>
              <div className="relative">
                <Input
                  id="trainingOrderFile"
                  name="trainingOrderFile"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, "trainingOrder")}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
                <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              {fileErrors.trainingOrder && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {fileErrors.trainingOrder}
                </div>
              )}
              <p className="text-sm text-gray-500">Upload your training order document (PDF only, max 10MB)</p>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Submitting..." : "Submit Booking Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
