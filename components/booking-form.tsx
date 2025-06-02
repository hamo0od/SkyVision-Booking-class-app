"use client"

import { useState } from "react"
import { createBooking } from "@/app/actions/bookings"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ModernDateTimePicker } from "./modern-date-time-picker"
import { CalendarDays, Users, MapPin, CheckCircle, AlertCircle } from "lucide-react"

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
      // Reset form elements
      const form = document.querySelector("form") as HTMLFormElement
      form?.reset()
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
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          New Booking Request
        </CardTitle>
      </CardHeader>
      <CardContent>
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
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
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{classroom.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        <Users className="inline h-3 w-3 mr-1" />
                        {classroom.capacity}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClassroom && (
              <div className="text-xs text-gray-600 mt-1">
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
            <label className="block text-sm font-medium text-gray-700">Purpose of Booking</label>
            <Textarea
              name="purpose"
              placeholder="Describe the purpose of your booking (e.g., Team meeting, Training session, Workshop...)"
              required
              className="min-h-[100px] resize-none"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting Request...
              </div>
            ) : (
              "Submit Booking Request"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
