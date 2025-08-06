'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Clock, UserCheck, Users, BookOpen, FileText, Eye, EyeOff } from 'lucide-react'
import { ModernDateTimePicker } from './modern-date-time-picker'
import { createBooking } from '@/app/actions/bookings'

interface Classroom {
  id: string
  name: string
  capacity: number
  description?: string
}

interface BookingFormProps {
  classrooms: Classroom[]
}

export function BookingForm({ classrooms }: BookingFormProps) {
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [startDateTime, setStartDateTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [instructorName, setInstructorName] = useState('')
  const [participants, setParticipants] = useState('1')
  const [ecaaApproval, setEcaaApproval] = useState('')
  const [approvalNumber, setApprovalNumber] = useState('')
  const [qualifications, setQualifications] = useState('')
  const [trainingOrder, setTrainingOrder] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [duration, setDuration] = useState('')

  // Calculate duration when times change
  useEffect(() => {
    if (startDateTime && endTime) {
      try {
        const startDate = new Date(startDateTime)
        const [hours, minutes] = endTime.split(':').map(Number)
        const endDate = new Date(startDate)
        endDate.setHours(hours, minutes, 0, 0)

        if (endDate > startDate) {
          const diffMs = endDate.getTime() - startDate.getTime()
          const diffMinutes = Math.floor(diffMs / (1000 * 60))
          const hours = Math.floor(diffMinutes / 60)
          const mins = diffMinutes % 60
          
          const durationText = `${hours}h ${mins}m`
          const isWithinLimit = diffMinutes <= 150 // 2.5 hours
          
          setDuration(isWithinLimit ? 
            `${durationText} (within 2.5h limit)` : 
            `${durationText} (exceeds 2.5h limit)`
          )
        } else {
          setDuration('Invalid time range')
        }
      } catch (error) {
        setDuration('')
      }
    } else {
      setDuration('')
    }
  }, [startDateTime, endTime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    // Validate required fields
    if (!selectedClassroom || !startDateTime || !endTime || !courseTitle || 
        !instructorName || !participants || !ecaaApproval || !trainingOrder) {
      setMessage('Please fill in all required fields.')
      setIsSubmitting(false)
      return
    }

    // Validate ECAA approval fields
    if (ecaaApproval === 'yes' && !approvalNumber) {
      setMessage('Please enter your ECAA approval number.')
      setIsSubmitting(false)
      return
    }

    if (ecaaApproval === 'no' && !qualifications) {
      setMessage('Please enter your qualifications.')
      setIsSubmitting(false)
      return
    }

    // Validate duration
    if (startDateTime && endTime) {
      const startDate = new Date(startDateTime)
      const [hours, minutes] = endTime.split(':').map(Number)
      const endDate = new Date(startDate)
      endDate.setHours(hours, minutes, 0, 0)

      if (endDate <= startDate) {
        setMessage('End time must be after start time.')
        setIsSubmitting(false)
        return
      }

      const diffMs = endDate.getTime() - startDate.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      
      if (diffMinutes > 150) { // 2.5 hours
        setMessage('Session duration cannot exceed 2.5 hours.')
        setIsSubmitting(false)
        return
      }
    }

    try {
      const formData = new FormData()
      formData.append('classroomId', selectedClassroom)
      formData.append('startTime', startDateTime)
      formData.append('endTime', endTime)
      formData.append('courseTitle', courseTitle)
      formData.append('instructorName', instructorName)
      formData.append('participants', participants)
      formData.append('ecaaApproval', ecaaApproval)
      formData.append('approvalNumber', approvalNumber)
      formData.append('qualifications', qualifications)
      formData.append('trainingOrder', trainingOrder)

      await createBooking(formData)
      
      // Reset form
      setSelectedClassroom('')
      setStartDateTime('')
      setEndTime('')
      setCourseTitle('')
      setInstructorName('')
      setParticipants('1')
      setEcaaApproval('')
      setApprovalNumber('')
      setQualifications('')
      setTrainingOrder('')
      setMessage('Booking request submitted successfully!')
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // Refresh page after short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
      
    } catch (error) {
      setMessage('Failed to submit booking request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardTitle className="text-2xl font-bold">Book a Classroom</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Classroom Selection */}
          <div className="space-y-2">
            <Label htmlFor="classroom" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Classroom
            </Label>
            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
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
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Start Date & Time
              </Label>
              <ModernDateTimePicker
                value={startDateTime}
                onChange={setStartDateTime}
                placeholder="Select start date and time"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                End Time (Same Day)
              </Label>
              <ModernDateTimePicker
                value={endTime}
                onChange={setEndTime}
                placeholder="Select end time"
                timeOnly={true}
                linkedDate={startDateTime}
                disabled={!startDateTime}
              />
            </div>
          </div>

          {/* Duration Display */}
          {duration && (
            <div className={`p-3 rounded-lg text-sm ${
              duration.includes('exceeds') 
                ? 'bg-red-50 text-red-800 border border-red-200' 
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              Duration: {duration}
            </div>
          )}

          {/* Course Title */}
          <div className="space-y-2">
            <Label htmlFor="courseTitle" className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4" />
              Course Title
            </Label>
            <Input
              id="courseTitle"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="e.g., Private Pilot License Ground School, Instrument Rating Course..."
              required
            />
          </div>

          {/* Instructor Name */}
          <div className="space-y-2">
            <Label htmlFor="instructorName" className="flex items-center gap-2 text-sm font-medium">
              <UserCheck className="h-4 w-4" />
              Instructor Name
            </Label>
            <Input
              id="instructorName"
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              placeholder="Enter the instructor's full name"
              required
            />
          </div>

          {/* Number of Participants */}
          <div className="space-y-2">
            <Label htmlFor="participants" className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              Number of Participants
            </Label>
            <Input
              id="participants"
              type="number"
              min="1"
              max="50"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              required
            />
          </div>

          {/* Training Order */}
          <div className="space-y-2">
            <Label htmlFor="trainingOrder" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Training Order
            </Label>
            <Input
              id="trainingOrder"
              value={trainingOrder}
              onChange={(e) => setTrainingOrder(e.target.value)}
              placeholder="Enter training order number"
              required
            />
          </div>

          {/* ECAA Approval */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <UserCheck className="h-4 w-4" />
              ECAA Approval Status
            </Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ecaaApproval"
                  value="yes"
                  checked={ecaaApproval === 'yes'}
                  onChange={(e) => setEcaaApproval(e.target.value)}
                  className="text-blue-600"
                />
                <span>Yes, I have ECAA approval</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ecaaApproval"
                  value="no"
                  checked={ecaaApproval === 'no'}
                  onChange={(e) => setEcaaApproval(e.target.value)}
                  className="text-blue-600"
                />
                <span>No, I don't have ECAA approval</span>
              </label>
            </div>

            {/* Conditional Fields */}
            {ecaaApproval === 'yes' && (
              <div className="space-y-2">
                <Label htmlFor="approvalNumber" className="text-sm font-medium">
                  ECAA Approval Number
                </Label>
                <Input
                  id="approvalNumber"
                  value={approvalNumber}
                  onChange={(e) => setApprovalNumber(e.target.value)}
                  placeholder="Enter your ECAA approval number"
                  required
                />
              </div>
            )}

            {ecaaApproval === 'no' && (
              <div className="space-y-2">
                <Label htmlFor="qualifications" className="text-sm font-medium">
                  Your Qualifications
                </Label>
                <Textarea
                  id="qualifications"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="Please describe your relevant qualifications and experience..."
                  rows={3}
                  required
                />
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
