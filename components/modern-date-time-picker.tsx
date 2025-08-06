'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

interface ModernDateTimePickerProps {
  value: string
  onChange: (value: string) => void
  name?: string
  required?: boolean
  timeOnly?: boolean
  linkedDate?: string
  disabled?: boolean
}

export function ModernDateTimePicker({
  value,
  onChange,
  name,
  required = false,
  timeOnly = false,
  linkedDate,
  disabled = false
}: ModernDateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isOpen, setIsOpen] = useState(false)

  // Initialize from value
  useEffect(() => {
    if (value) {
      if (timeOnly) {
        setSelectedTime(value)
      } else {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          setSelectedDate(date)
          setSelectedTime(date.toTimeString().slice(0, 5))
          setCurrentMonth(date)
        }
      }
    }
  }, [value, timeOnly])

  // Generate time slots from 8 AM to 6 PM
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break // Stop at 6:00 PM
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const displayTime = formatTime(timeString)
        slots.push({ value: timeString, display: displayTime })
      }
    }
    return slots
  }

  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(':')
    const hourNum = parseInt(hour)
    const ampm = hourNum >= 12 ? 'PM' : 'AM'
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum
    return `${displayHour}:${minute} ${ampm}`
  }

  const getAvailableTimeSlots = () => {
    const allSlots = generateTimeSlots()
    
    if (timeOnly && linkedDate) {
      const linkedDateTime = new Date(linkedDate)
      const today = new Date()
      
      // If the linked date is today, filter out past times
      if (linkedDateTime.toDateString() === today.toDateString()) {
        const currentTime = today.getHours() * 60 + today.getMinutes()
        return allSlots.filter(slot => {
          const [hour, minute] = slot.value.split(':')
          const slotTime = parseInt(hour) * 60 + parseInt(minute)
          return slotTime > currentTime
        })
      }
    } else if (!timeOnly && selectedDate) {
      const today = new Date()
      
      // If selected date is today, filter out past times
      if (selectedDate.toDateString() === today.toDateString()) {
        const currentTime = today.getHours() * 60 + today.getMinutes()
        return allSlots.filter(slot => {
          const [hour, minute] = slot.value.split(':')
          const slotTime = parseInt(hour) * 60 + parseInt(minute)
          return slotTime > currentTime
        })
      }
    }
    
    return allSlots
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    if (selectedTime) {
      const [hour, minute] = selectedTime.split(':')
      const dateTime = new Date(date)
      dateTime.setHours(parseInt(hour), parseInt(minute), 0, 0)
      onChange(dateTime.toISOString().slice(0, 16))
    }
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    
    if (timeOnly) {
      onChange(time)
    } else if (selectedDate) {
      const [hour, minute] = time.split(':')
      const dateTime = new Date(selectedDate)
      dateTime.setHours(parseInt(hour), parseInt(minute), 0, 0)
      onChange(dateTime.toISOString().slice(0, 16))
    }
    
    setIsOpen(false)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const displayValue = () => {
    if (timeOnly) {
      return selectedTime ? formatTime(selectedTime) : 'Select Time (8:00 AM - 6:00 PM)'
    } else {
      if (selectedDate && selectedTime) {
        return `${formatDate(selectedDate)} ${formatTime(selectedTime)}`
      } else if (selectedDate) {
        return formatDate(selectedDate)
      } else {
        return 'Select Date & Time'
      }
    }
  }

  // Auto-advance to next day if current time is past 6 PM
  useEffect(() => {
    if (!timeOnly && !value) {
      const now = new Date()
      const currentHour = now.getHours()
      
      if (currentHour >= 18) {
        // After 6 PM, set to tomorrow
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        setSelectedDate(tomorrow)
        setCurrentMonth(tomorrow)
      } else {
        // Before 6 PM, set to today
        setSelectedDate(now)
        setCurrentMonth(now)
      }
    }
  }, [timeOnly, value])

  return (
    <div className="w-full">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
            disabled={disabled}
          >
            {timeOnly ? (
              <Clock className="mr-2 h-4 w-4" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            {displayValue()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            {!timeOnly && (
              <div className="mb-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-semibold">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-center text-sm font-medium p-2">
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth(currentMonth).map((date, index) => (
                    <div key={index} className="text-center">
                      {date ? (
                        <Button
                          variant={selectedDate && date.toDateString() === selectedDate.toDateString() ? "default" : "ghost"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          disabled={isDateDisabled(date)}
                          onClick={() => handleDateSelect(date)}
                        >
                          {date.getDate()}
                        </Button>
                      ) : (
                        <div className="w-8 h-8" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time Selection */}
            <div>
              <h4 className="font-medium mb-2">
                {timeOnly ? 'Select Time (8:00 AM - 6:00 PM)' : 'Select Time'}
              </h4>
              <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto">
                {getAvailableTimeSlots().map(slot => (
                  <Button
                    key={slot.value}
                    variant={selectedTime === slot.value ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleTimeSelect(slot.value)}
                  >
                    {slot.display}
                  </Button>
                ))}
              </div>
              {getAvailableTimeSlots().length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No available time slots for this date
                </p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Hidden input for form submission */}
      {name && (
        <Input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}
    </div>
  )
}
