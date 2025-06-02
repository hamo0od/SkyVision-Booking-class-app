"use client"

import { useState } from "react"
import { createBooking } from "@/app/actions/bookings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      await createBooking(formData)
      alert("Booking request submitted successfully!")
      // Reset form
      setSelectedClassroom("")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to submit booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Booking Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Classroom</label>
            <Select name="classroomId" value={selectedClassroom} onValueChange={setSelectedClassroom} required>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Time</label>
              <Input type="datetime-local" name="startTime" required min={new Date().toISOString().slice(0, 16)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Time</label>
              <Input type="datetime-local" name="endTime" required min={new Date().toISOString().slice(0, 16)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Purpose</label>
            <Textarea name="purpose" placeholder="Describe the purpose of your booking..." required />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
