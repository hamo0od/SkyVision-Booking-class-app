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
import { CalendarDays, Users, MapPin, CheckCircle, AlertCircle, Award, UserCheck, FileText } from "lucide-react"
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
  const [hasEcaaApproval, setHasEcaaApproval] = useState("false")

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await createBooking(formData)
      setMessage({ type: "success", text: result.message })

      // Reset form
      setSelectedClassroom("")
      setStartTime("")
      setEndTime("")
      setHasEcaaApproval("false")
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

        <form action={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <MapPin className="inline h-4 w-4 mr-1" />
              Classroom
            </label>
            <Select name="classroomId" value={selectedClassroom} onValueChange={setSelectedClassroom} required>
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
            {selectedClassroom && (
              <div className="text-xs text-gray-600 mt-1 p-2 bg-blue-50 rounded">
                {classrooms.find((c) => c.id === selectedClassroom)?.description}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <ModernDateTimePicker
              label="Start Time"
              name="startTime"
              value={startTime}
              onChange={setStartTime}
              min={minDateTime}
              required
            />
            <ModernDateTimePicker
              label="End Time"
              name="endTime"
              value={endTime}
              onChange={setEndTime}
              min={startTime || minDateTime}
              required
            />
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
            <RadioGroup
              name="ecaaApproval"
              value={hasEcaaApproval}
              onValueChange={setHasEcaaApproval}
              className="flex flex-col space-y-1"
            >
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

            {hasEcaaApproval === "true" ? (
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
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Purpose of Booking</label>
            <Textarea
              name="purpose"
              placeholder="Describe the purpose of your booking (e.g., Team meeting, Training session, Workshop...)"
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
