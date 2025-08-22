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

          {/* Date Selection */}
          <div className="space-y-4">
            {isBulkBooking ? (
              <div className="space-y-3">
                <Label>Select Dates *</Label>
                <BulkDatePicker selectedDates={selectedDates} onDatesChange={setSelectedDates} />
                {selectedDates.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Selected {selectedDates.length} date{selectedDates.length > 1 ? "s" : ""}
                  </p>
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

          {/* Classroom Selection */}
          <div className="space-y-3">
            <Label htmlFor="classroomId">Classroom *</Label>
            <Select name="classroomId">
              <SelectTrigger>
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
          </div>

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
          <div className="space-y-4">
            <Label>Do you have ECAA instructor approval? *</Label>
            <RadioGroup name="ecaaInstructorApproval">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="ecaa-yes" />
                <Label htmlFor="ecaa-yes">Yes, I have ECAA instructor approval</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="ecaa-no" />
                <Label htmlFor="ecaa-no">No, I don't have ECAA instructor approval</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Conditional Fields */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="ecaaApprovalNumber">ECAA Approval Number (if applicable)</Label>
              <Input id="ecaaApprovalNumber" name="ecaaApprovalNumber" placeholder="Enter ECAA approval number" />
            </div>

            <div className="space-y-3">
              <Label htmlFor="qualifications">Qualifications (if no ECAA approval)</Label>
              <Textarea id="qualifications" name="qualifications" placeholder="Describe your qualifications" rows={3} />
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="ecaaApprovalFile">ECAA Approval PDF (if applicable)</Label>
              <Input id="ecaaApprovalFile" name="ecaaApprovalFile" type="file" accept=".pdf" />
              <p className="text-sm text-gray-500">Upload your ECAA approval document (PDF only, max 10MB)</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="trainingOrderFile">Training Order PDF *</Label>
              <Input id="trainingOrderFile" name="trainingOrderFile" type="file" accept=".pdf" required />
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
