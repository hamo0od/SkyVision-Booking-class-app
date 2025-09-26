"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createBooking } from "@/app/actions/bookings"
import { BulkDatePicker } from "./bulk-date-picker"
import { ModernDateTimePicker } from "./modern-date-time-picker"
import { AlertCircle, CheckCircle2, Upload, Home } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Classroom {
  id: string
  name: string
  capacity: number
  location: string
}

interface BookingFormProps {
  classrooms: Classroom[]
}

export function BookingForm({ classrooms }: BookingFormProps) {
  const [isPending, startTransition] = useTransition()
  const [bookingType, setBookingType] = useState<"single" | "bulk">("single")
  const [selectedClassroom, setSelectedClassroom] = useState<string>("")
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [ecaaInstructorApproval, setEcaaInstructorApproval] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const { toast } = useToast()

  // Initialize departments array properly
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

  const handleSubmit = async (formData: FormData) => {
    setError("")
    setSuccess("")

    try {
      startTransition(async () => {
        // Add booking type and selected dates to form data
        formData.set("isBulkBooking", bookingType === "bulk" ? "true" : "false")

        if (bookingType === "bulk") {
          // Add selected dates to form data
          selectedDates.forEach((date) => {
            formData.append("selectedDates", date.toISOString().split("T")[0])
          })
        }

        const result = await createBooking(formData)

        if (result.success) {
          setSuccess(result.message || "Booking created successfully!")
          toast({
            title: "Success",
            description: result.message || "Booking created successfully!",
          })

          // Reset form
          setSelectedClassroom("")
          setSelectedDates([])
          setEcaaInstructorApproval("")

          // Reset form elements
          const form = document.getElementById("booking-form") as HTMLFormElement
          if (form) {
            form.reset()
          }
        }
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Book a Classroom</CardTitle>
          <CardDescription>Fill out the form below to request a classroom booking.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <form id="booking-form" action={handleSubmit} className="space-y-6">
            {/* Booking Type */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Booking Type</Label>
              <RadioGroup
                value={bookingType}
                onValueChange={(value) => setBookingType(value as "single" | "bulk")}
                className="flex flex-col space-y-2"
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

            {/* Classroom Selection - Priority */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-600" />
                  Select Classroom First *
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedClassroom} onValueChange={setSelectedClassroom} name="classroomId" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose your classroom" />
                  </SelectTrigger>
                  <SelectContent>
                    {classrooms.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.id}>
                        {classroom.name} - Capacity: {classroom.capacity} people
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-blue-600 mt-2">
                  Select your preferred classroom before choosing dates and times.
                </p>
              </CardContent>
            </Card>

            {/* Date and Time Selection */}
            {bookingType === "single" ? (
              <div className="space-y-4">
                <Label className="text-base font-medium">Date & Time *</Label>
                <ModernDateTimePicker />
              </div>
            ) : (
              <div className="space-y-4">
                <Label className="text-base font-medium">Select Multiple Dates *</Label>
                <BulkDatePicker selectedDates={selectedDates} onDatesChange={setSelectedDates} />
                {selectedDates.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-base font-medium">Time for All Selected Dates *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input type="time" id="startTime" name="startTime" required />
                      </div>
                      <div>
                        <Label htmlFor="endTime">End Time</Label>
                        <Input type="time" id="endTime" name="endTime" required />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Course Title */}
            <div className="space-y-2">
              <Label htmlFor="purpose">Course Title *</Label>
              <Textarea
                id="purpose"
                name="purpose"
                placeholder="Enter the course title"
                required
                className="min-h-[80px]"
              />
            </div>

            {/* Instructor Name */}
            <div className="space-y-2">
              <Label htmlFor="instructorName">Instructor Name *</Label>
              <Input id="instructorName" name="instructorName" placeholder="Enter instructor name" required />
            </div>

            {/* Training Order */}
            <div className="space-y-2">
              <Label htmlFor="trainingOrder">Training Order *</Label>
              <Input id="trainingOrder" name="trainingOrder" placeholder="Enter training order" required />
            </div>

            {/* Course Reference */}
            <div className="space-y-2">
              <Label htmlFor="courseReference">Course Reference</Label>
              <Input id="courseReference" name="courseReference" placeholder="Enter course reference (optional)" />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select name="department" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
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

            {/* Number of Participants */}
            <div className="space-y-2">
              <Label htmlFor="participants">Number of Participants *</Label>
              <Input
                type="number"
                id="participants"
                name="participants"
                min="1"
                placeholder="Enter number of participants"
                required
              />
            </div>

            {/* ECAA Instructor Approval */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Do you have ECAA instructor approval? *</Label>
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
            </div>

            {/* Conditional Fields based on ECAA Approval */}
            {ecaaInstructorApproval === "true" && (
              <div className="space-y-4 p-4 border border-green-200 rounded-lg bg-green-50">
                <div className="space-y-2">
                  <Label htmlFor="ecaaApprovalNumber">ECAA Approval Number *</Label>
                  <Input
                    id="ecaaApprovalNumber"
                    name="ecaaApprovalNumber"
                    placeholder="Enter ECAA approval number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ecaaApprovalFile">ECAA Approval Document (PDF) *</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      id="ecaaApprovalFile"
                      name="ecaaApprovalFile"
                      accept=".pdf"
                      required
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <Upload className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">Upload your ECAA approval document (PDF only, max 10MB)</p>
                </div>
              </div>
            )}

            {ecaaInstructorApproval === "false" && (
              <div className="space-y-4 p-4 border border-orange-200 rounded-lg bg-orange-50">
                <div className="space-y-2">
                  <Label htmlFor="qualifications">Your Qualifications *</Label>
                  <Textarea
                    id="qualifications"
                    name="qualifications"
                    placeholder="Please describe your qualifications and experience"
                    required
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* Training Order File */}
            <div className="space-y-2">
              <Label htmlFor="trainingOrderFile">Training Order Document (PDF) *</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  id="trainingOrderFile"
                  name="trainingOrderFile"
                  accept=".pdf"
                  required
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <Upload className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">Upload your training order document (PDF only, max 10MB)</p>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Submitting..." : `Submit ${bookingType === "bulk" ? "Bulk " : ""}Booking Request`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
