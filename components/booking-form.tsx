"use client"

import { useState } from "react"
import { createBooking } from "@/app/actions/bookings"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ModernDateTimePicker } from "./modern-date-time-picker"
import {
  CalendarDays,
  Users,
  MapPin,
  CheckCircle,
  AlertCircle,
  Award,
  UserCheck,
  FileText,
  BookOpen,
  Clock,
} from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Classroom {
  id: string
  name: string
  capacity: number
  description: string | null
}

interface BookingFormProps {
  classrooms: Classroom[]
}

export function BookingForm({ classrooms }: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedClassroom, setSelectedClassroom] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [hasEcaaApproval, setHasEcaaApproval] = useState("") // force explicit choice
  const [durationWarning, setDurationWarning] = useState("")

  // Calculate duration and show warning if needed
  const checkDuration = (start: string, end: string) => {
    if (start && end) {
      const startDate = new Date(start)
      const endDate = new Date(end)
      const durationInMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60)

      if (durationInMinutes <= 0) {
        setDurationWarning("End time must be after start time")
      } else {
        const hours = Math.floor(durationInMinutes / 60)
        const minutes = Math.round(durationInMinutes % 60)
        setDurationWarning(`Duration: ${hours}h ${minutes}m`)
      }
    } else {
      setDurationWarning("")
    }
  }

  const handleStartTimeChange = (value: string) => {
    setStartTime(value)
    if (endTime) checkDuration(value, endTime)
  }

  const handleEndTimeChange = (value: string) => {
    setEndTime(value)
    if (startTime) checkDuration(startTime, value)
  }

  // Client-side guard: block submit if required fields not chosen (especially classroom/ECAA)
  const preValidate = (formData: FormData): string | null => {
    const classroomId = (formData.get("classroomId") as string | null)?.trim() || ""
    const start = (formData.get("startTime") as string | null)?.trim() || ""
    const end = (formData.get("endTime") as string | null)?.trim() || ""
    const instructor = (formData.get("instructorName") as string | null)?.trim() || ""
    const tOrder = (formData.get("trainingOrder") as string | null)?.trim() || ""
    const participants = (formData.get("participants") as string | null)?.trim() || ""
    const purpose = (formData.get("purpose") as string | null)?.trim() || ""
    const ecaa = (formData.get("ecaaApproval") as string | null)?.trim() || ""

    if (!classroomId) return "Please select a classroom."
    if (!start) return "Please select a start date and time."
    if (!end) return "Please select an end time."
    if (!instructor) return "Instructor name is required."
    if (!tOrder) return "Training order is required."
    if (!participants) return "Number of participants is required."
    if (!purpose) return "Course title is required."
    if (ecaa !== "true" && ecaa !== "false") return "Please select your ECAA approval status."

    if (ecaa === "true") {
      const approvalNumber = (formData.get("approvalNumber") as string | null)?.trim() || ""
      if (!approvalNumber) return "ECAA approval number is required."
    } else if (ecaa === "false") {
      const qualifications = (formData.get("qualifications") as string | null)?.trim() || ""
      if (!qualifications) return "Qualifications are required if you don't have ECAA approval."
    }

    return null
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setMessage(null)

    // ensure the selected values are posted
    formData.set("classroomId", selectedClassroom)
    formData.set("ecaaApproval", hasEcaaApproval)

    const validationError = preValidate(formData)
    if (validationError) {
      setMessage({ type: "error", text: validationError })
      setIsSubmitting(false)
      return
    }

    try {
      const result = await createBooking(formData)
      setMessage({ type: "success", text: result.message })

      // Reset form
      setSelectedClassroom("")
      setStartTime("")
      setEndTime("")
      setHasEcaaApproval("")
      setDurationWarning("")

      // Reset form elements
      const form = document.querySelector("form") as HTMLFormElement
      form?.reset()

      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to submit booking",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const minDateTime = new Date().toISOString().slice(0, 16)

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          New Booking Request
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {message && (
          <div
            className={`p-3 rounded-lg flex items-start gap-2 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form action={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <MapPin className="inline h-4 w-4 mr-1" />
              Classroom
            </label>
            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a classroom" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
                      <span className="font-medium">{classroom.name}</span>
                      <span className="text-sm text-gray-500 sm:ml-2">
                        <Users className="inline h-3 w-3 mr-1" />
                        {classroom.capacity} people
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Hidden inputs to carry values to FormData; validation handled in JS */}
            <input type="hidden" name="classroomId" value={selectedClassroom} />
            {selectedClassroom && (
              <div className="text-xs text-gray-600 mt-1 p-2 bg-blue-50 rounded">
                {classrooms.find((c) => c.id === selectedClassroom)?.description}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <ModernDateTimePicker
              label="Start Date & Time"
              name="startTime"
              value={startTime}
              onChange={handleStartTimeChange}
              min={minDateTime}
              required
            />

            <ModernDateTimePicker
              label="End Time (Same Day)"
              name="endTime"
              value={endTime}
              onChange={handleEndTimeChange}
              min={startTime}
              required
              timeOnly={true}
              linkedDate={startTime}
            />

            {durationWarning && (
              <div
                className={`p-2 rounded-lg flex items-center gap-2 text-sm bg-blue-50 text-blue-800 border border-blue-200`}
              >
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>{durationWarning}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <UserCheck className="h-4 w-4 text-gray-600" />
              Instructor Name
            </Label>
            <Input
              type="text"
              name="instructorName"
              placeholder="Enter the instructor's full name"
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <FileText className="h-4 w-4 text-gray-600" />
              Training Order
            </Label>
            <Input
              type="text"
              name="trainingOrder"
              placeholder="Enter training order number or reference"
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Users className="h-4 w-4 text-gray-600" />
              Number of Participants
            </Label>
            <Input
              type="number"
              name="participants"
              min="1"
              max="100"
              placeholder="Enter number of participants"
              required
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-1">
              <Award className="h-4 w-4 text-gray-600" />
              ECAA Approval Status
            </Label>
            <RadioGroup value={hasEcaaApproval} onValueChange={setHasEcaaApproval} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="ecaa-yes" />
                <Label htmlFor="ecaa-yes" className="font-normal">
                  Yes, I have ECAA Approval
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="ecaa-no" />
                <Label htmlFor="ecaa-no" className="font-normal">
                  No, I don't have ECAA Approval
                </Label>
              </div>
            </RadioGroup>
            <input type="hidden" name="ecaaApproval" value={hasEcaaApproval} />

            {hasEcaaApproval !== "" &&
              (hasEcaaApproval === "true" ? (
                <div className="pt-2">
                  <Label htmlFor="approvalNumber" className="text-sm">
                    ECAA Approval Number
                  </Label>
                  <Input
                    id="approvalNumber"
                    name="approvalNumber"
                    placeholder="Enter your ECAA approval number"
                    required
                    className="mt-1"
                  />
                </div>
              ) : (
                <div className="pt-2">
                  <Label htmlFor="qualifications" className="text-sm">
                    Your Qualifications
                  </Label>
                  <Textarea
                    id="qualifications"
                    name="qualifications"
                    placeholder="Describe your qualifications and experience"
                    required
                    className="mt-1 min-h-[80px]"
                  />
                </div>
              ))}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              Course Title
            </label>
            <Textarea
              name="purpose"
              placeholder="Enter the course title (e.g., Private Pilot License Ground School, Instrument Rating Course, Commercial Pilot Training...)"
              required
              className="min-h-[80px] sm:min-h-[100px] resize-none text-sm"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Submitting Request...</span>
                <span className="sm:hidden">Submitting...</span>
              </div>
            ) : (
              <>
                <span className="hidden sm:inline">Submit Booking Request</span>
                <span className="sm:hidden">Submit Request</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
