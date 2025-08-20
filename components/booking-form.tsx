"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createBooking } from "@/app/actions/bookings"
import { ModernDateTimePicker } from "./modern-date-time-picker"
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

const departments = [
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startTime, setStartTime] = useState<Date>()
  const [endTime, setEndTime] = useState<Date>()
  const [ecaaInstructorApproval, setEcaaInstructorApproval] = useState<string>("")
  const [isBulkBooking, setIsBulkBooking] = useState(false)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [fileErrors, setFileErrors] = useState<{ ecaa?: string; training?: string }>({})
  const { toast } = useToast()

  // Reset time fields when bulk booking mode changes
  useEffect(() => {
    if (isBulkBooking) {
      // Reset to 7 AM for bulk bookings
      const defaultStart = new Date()
      defaultStart.setHours(7, 0, 0, 0)
      const defaultEnd = new Date()
      defaultEnd.setHours(8, 0, 0, 0)

      setStartTime(defaultStart)
      setEndTime(defaultEnd)
    } else {
      // Reset to current time for regular bookings
      setStartTime(undefined)
      setEndTime(undefined)
    }
  }, [isBulkBooking])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fileType: "ecaa" | "training") => {
    const file = event.target.files?.[0]
    if (file) {
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        setFileErrors((prev) => ({
          ...prev,
          [fileType]: `File size must be less than 10MB. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB`,
        }))
        // Clear the file input
        event.target.value = ""
      } else {
        setFileErrors((prev) => ({
          ...prev,
          [fileType]: undefined,
        }))
      }
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    try {
      const result = await createBooking(formData)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        // Reset form
        const form = document.getElementById("booking-form") as HTMLFormElement
        form?.reset()
        setStartTime(undefined)
        setEndTime(undefined)
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

  const getDuration = () => {
    if (!startTime || !endTime) return ""
    const diffMs = endTime.getTime() - startTime.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const hours = Math.floor(diffHours)
    const minutes = Math.round((diffHours - hours) * 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Book a Classroom</CardTitle>
        <CardDescription>Fill out the form below to request a classroom booking.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="booking-form" action={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classroomId">Classroom *</Label>
              <Select name="classroomId" required>
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

            <div className="space-y-2">
              <Label htmlFor="participants">Number of Participants *</Label>
              <Input id="participants" name="participants" type="number" min="1" defaultValue="1" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select name="department" required>
              <SelectTrigger>
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isBulkBooking"
                name="isBulkBooking"
                checked={isBulkBooking}
                onChange={(e) => setIsBulkBooking(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isBulkBooking">Bulk Booking (multiple dates)</Label>
            </div>

            {isBulkBooking ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Multiple Dates *</Label>
                  <ModernDateTimePicker
                    mode="multiple-dates"
                    selectedDates={selectedDates}
                    onDatesChange={setSelectedDates}
                    startTime={startTime}
                    endTime={endTime}
                    onStartTimeChange={setStartTime}
                    onEndTimeChange={setEndTime}
                  />
                  {selectedDates.map((date) => (
                    <input key={date} type="hidden" name="selectedDates" value={date} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date & Time *</Label>
                  <ModernDateTimePicker mode="datetime" value={startTime} onChange={setStartTime} />
                </div>

                <div className="space-y-2">
                  <Label>End Date & Time *</Label>
                  <ModernDateTimePicker mode="datetime" value={endTime} onChange={setEndTime} />
                </div>
              </div>
            )}

            {startTime && endTime && <div className="text-sm text-gray-600">Duration: {getDuration()}</div>}

            <input type="hidden" name="startTime" value={startTime?.toISOString() || ""} />
            <input type="hidden" name="endTime" value={endTime?.toISOString() || ""} />
            <input type="hidden" name="isBulkBooking" value={isBulkBooking.toString()} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose/Description *</Label>
            <Textarea id="purpose" name="purpose" placeholder="Describe the purpose of your booking..." required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instructorName">Instructor Name *</Label>
              <Input id="instructorName" name="instructorName" placeholder="Enter instructor name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trainingOrder">Training Order *</Label>
              <Input id="trainingOrder" name="trainingOrder" placeholder="Enter training order number" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseReference">Course Reference</Label>
            <Input id="courseReference" name="courseReference" placeholder="Enter course reference (optional)" />
          </div>

          <div className="space-y-4">
            <Label>ECAA Instructor Approval *</Label>
            <RadioGroup
              value={ecaaInstructorApproval}
              onValueChange={setEcaaInstructorApproval}
              name="ecaaInstructorApproval"
              required
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="ecaa-yes" />
                <Label htmlFor="ecaa-yes">Yes, I have ECAA instructor approval</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="ecaa-no" />
                <Label htmlFor="ecaa-no">No, I don't have ECAA instructor approval</Label>
              </div>
            </RadioGroup>

            {ecaaInstructorApproval === "true" && (
              <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                <div className="space-y-2">
                  <Label htmlFor="ecaaApprovalNumber">ECAA Approval Number *</Label>
                  <Input
                    id="ecaaApprovalNumber"
                    name="ecaaApprovalNumber"
                    placeholder="Enter your ECAA approval number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ecaaApprovalFile">ECAA Approval PDF *</Label>
                  <Input
                    id="ecaaApprovalFile"
                    name="ecaaApprovalFile"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, "ecaa")}
                    required
                  />
                  {fileErrors.ecaa && <p className="text-sm text-red-600">{fileErrors.ecaa}</p>}
                  <p className="text-xs text-gray-500">Upload your ECAA approval document (PDF only, max 10MB)</p>
                </div>
              </div>
            )}

            {ecaaInstructorApproval === "false" && (
              <div className="space-y-2 pl-6 border-l-2 border-orange-200">
                <Label htmlFor="qualifications">Your Qualifications *</Label>
                <Textarea
                  id="qualifications"
                  name="qualifications"
                  placeholder="Please describe your relevant qualifications and experience..."
                  required
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="trainingOrderFile">Training Order PDF *</Label>
            <Input
              id="trainingOrderFile"
              name="trainingOrderFile"
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(e, "training")}
              required
            />
            {fileErrors.training && <p className="text-sm text-red-600">{fileErrors.training}</p>}
            <p className="text-xs text-gray-500">Upload your training order document (PDF only, max 10MB)</p>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit Booking Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
