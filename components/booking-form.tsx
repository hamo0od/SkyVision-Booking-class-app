'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, Users, UserCheck, FileText, CheckCircle, XCircle } from 'lucide-react'
import { createBooking } from '@/app/actions/bookings'
import { ModernDateTimePicker } from './modern-date-time-picker'

interface Classroom {
  id: string
  name: string
  capacity: number
}

interface BookingFormProps {
  classrooms: Classroom[]
}

export function BookingForm({ classrooms }: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [startDateTime, setStartDateTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [ecaaApproval, setEcaaApproval] = useState<boolean | null>(null)
  const [duration, setDuration] = useState<string>('')

  // Calculate duration when times change
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return ''
    
    const startDate = new Date(start)
    const endDate = new Date(end)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return ''
    
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes <= 0) return 'Invalid time range'
    
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    
    let durationText = ''
    if (hours > 0) durationText += `${hours}h `
    if (minutes > 0) durationText += `${minutes}m`
    
    const isOverLimit = diffMinutes > 150 // 2.5 hours
    return `${durationText.trim()} ${isOverLimit ? '(Exceeds 2.5h limit!)' : 'within 2.5h limit'}`
  }

  const handleStartTimeChange = (value: string) => {
    setStartDateTime(value)
    if (endTime) {
      // Combine start date with end time
      const startDate = new Date(value)
      const [endHour, endMinute] = endTime.split(':')
      const endDateTime = new Date(startDate)
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)
      
      const endDateTimeString = endDateTime.toISOString().slice(0, 16)
      setDuration(calculateDuration(value, endDateTimeString))
    }
  }

  const handleEndTimeChange = (value: string) => {
    setEndTime(value)
    if (startDateTime) {
      // Combine start date with end time
      const startDate = new Date(startDateTime)
      const [endHour, endMinute] = value.split(':')
      const endDateTime = new Date(startDate)
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)
      
      const endDateTimeString = endDateTime.toISOString().slice(0, 16)
      setDuration(calculateDuration(startDateTime, endDateTimeString))
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      // Combine start date with end time for the end datetime
      if (startDateTime && endTime) {
        const startDate = new Date(startDateTime)
        const [endHour, endMinute] = endTime.split(':')
        const endDateTime = new Date(startDate)
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)
        
        formData.set('endTime', endDateTime.toISOString())
      }

      const result = await createBooking(formData)
      setMessage({ type: 'success', text: result.message })
      
      // Reset form
      const form = document.getElementById('booking-form') as HTMLFormElement
      if (form) {
        form.reset()
        setStartDateTime('')
        setEndTime('')
        setEcaaApproval(null)
        setDuration('')
      }

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create booking'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Book a Classroom
        </CardTitle>
      </CardHeader>
      <CardContent>
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        <form id="booking-form" action={handleSubmit} className="space-y-6">
          {/* Classroom Selection */}
          <div className="space-y-2">
            <Label htmlFor="classroomId" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Classroom
            </Label>
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

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date & Time
              </Label>
              <ModernDateTimePicker
                value={startDateTime}
                onChange={handleStartTimeChange}
                name="startTime"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                End Time (Same Day)
              </Label>
              <ModernDateTimePicker
                value={endTime}
                onChange={handleEndTimeChange}
                timeOnly={true}
                linkedDate={startDateTime}
                disabled={!startDateTime}
                required
              />
            </div>
          </div>

          {/* Duration Display */}
          {duration && (
            <div className={`p-3 rounded-lg text-sm ${
              duration.includes('Exceeds') 
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <strong>Duration:</strong> {duration}
            </div>
          )}

          {/* Course Title */}
          <div className="space-y-2">
            <Label htmlFor="purpose" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Course Title
            </Label>
            <Input
              id="purpose"
              name="purpose"
              placeholder="e.g., Private Pilot License Ground School, Instrument Rating Course..."
              required
            />
          </div>

          {/* Instructor Name */}
          <div className="space-y-2">
            <Label htmlFor="instructorName" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Instructor Name
            </Label>
            <Input
              id="instructorName"
              name="instructorName"
              placeholder="Enter instructor's full name"
              required
            />
          </div>

          {/* Training Order */}
          <div className="space-y-2">
            <Label htmlFor="trainingOrder" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Training Order
            </Label>
            <Input
              id="trainingOrder"
              name="trainingOrder"
              placeholder="Enter training order number"
              required
            />
          </div>

          {/* Number of Participants */}
          <div className="space-y-2">
            <Label htmlFor="participants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Number of Participants
            </Label>
            <Input
              id="participants"
              name="participants"
              type="number"
              min="1"
              max="50"
              placeholder="Enter number of participants"
              required
            />
          </div>

          {/* ECAA Approval */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              ECAA Approval Status
            </Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="ecaaApproval"
                  value="true"
                  onChange={() => setEcaaApproval(true)}
                  className="text-blue-600"
                  required
                />
                <span>Yes, I have ECAA approval</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="ecaaApproval"
                  value="false"
                  onChange={() => setEcaaApproval(false)}
                  className="text-blue-600"
                  required
                />
                <span>No, I don't have ECAA approval</span>
              </label>
            </div>

            {/* Conditional Fields */}
            {ecaaApproval === true && (
              <div className="space-y-2">
                <Label htmlFor="approvalNumber">ECAA Approval Number</Label>
                <Input
                  id="approvalNumber"
                  name="approvalNumber"
                  placeholder="Enter your ECAA approval number"
                  required
                />
              </div>
            )}

            {ecaaApproval === false && (
              <div className="space-y-2">
                <Label htmlFor="qualifications">Your Qualifications</Label>
                <Textarea
                  id="qualifications"
                  name="qualifications"
                  placeholder="Please describe your relevant qualifications and experience..."
                  rows={3}
                  required
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || (duration && duration.includes('Exceeds'))}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Booking...
              </>
            ) : (
              'Create Booking Request'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
