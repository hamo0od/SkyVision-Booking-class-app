'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

interface ModernDateTimePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  timeOnly?: boolean
  linkedDate?: string
  disabled?: boolean
}

export function ModernDateTimePicker({ 
  value, 
  onChange, 
  placeholder = "Select date and time",
  timeOnly = false,
  linkedDate = '',
  disabled = false
}: ModernDateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
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
          setSelectedTime(formatTime(date))
        }
      }
    }
  }, [value, timeOnly])

  // Auto-advance to next day if current time is past 6 PM
  useEffect(() => {
    if (!timeOnly && !value) {
      const now = new Date()
      const currentHour = now.getHours()
      
      if (currentHour >= 18) { // 6 PM or later
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        setSelectedDate(tomorrow)
        setCurrentMonth(tomorrow)
      } else {
        setSelectedDate(now)
        setCurrentMonth(now)
      }
    }
  }, [timeOnly, value])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const displaySelectedDate = () => {
    if (timeOnly) {
      return selectedTime || placeholder
    }
    
    if (selectedDate && selectedTime) {
      return `${selectedDate.toLocaleDateString()} ${selectedTime}`
    }
    
    if (selectedDate) {
      return selectedDate.toLocaleDateString()
    }
    
    return placeholder
  }

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break // Stop at 6:00 PM
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const displayTime = new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
        
        slots.push({ value: timeString, display: displayTime })
      }
    }
    return slots
  }

  const getAvailableTimeSlots = () => {
    const allSlots = generateTimeSlots()
    
    if (timeOnly && linkedDate) {
      // For end time, filter based on start time
      const linkedDateTime = new Date(linkedDate)
      const isToday = formatDate(linkedDateTime) === formatDate(new Date())
      
      if (isToday) {
        const now = new Date()
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        const startTime = formatTime(linkedDateTime)
        
        return allSlots.filter(slot => slot.value > Math.max(currentTime, startTime))
      } else {
        const startTime = formatTime(linkedDateTime)
        return allSlots.filter(slot => slot.value > startTime)
      }
    }
    
    if (!timeOnly && selectedDate) {
      const isToday = formatDate(selectedDate) === formatDate(new Date())
      
      if (isToday) {
        const now = new Date()
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        return allSlots.filter(slot => slot.value > currentTime)
      }
    }
    
    return allSlots
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const dateTime = new Date(date)
      dateTime.setHours(hours, minutes, 0, 0)
      onChange(dateTime.toISOString())
    }
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    
    if (timeOnly) {
      onChange(time)
    } else if (selectedDate) {
      const [hours, minutes] = time.split(':').map(Number)
      const dateTime = new Date(selectedDate)
      dateTime.setHours(hours, minutes, 0, 0)
      onChange(dateTime.toISOString())
    }
    
    setIsOpen(false)
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  if (disabled) {
    return (
      <div className="w-full p-3 border border-gray-200 rounded-md bg-gray-50 text-gray-400">
        {placeholder}
      </div>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          {timeOnly ? (
            <Clock className="mr-2 h-4 w-4" />
          ) : (
            <Calendar className="mr-2 h-4 w-4" />
          )}
          {displaySelectedDate()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          {!timeOnly && (
            <>
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-semibold">
                  {currentMonth.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                {getDaysInMonth(currentMonth).map((date, index) => (
                  <div key={index} className="p-1">
                    {date && (
                      <Button
                        variant={selectedDate && formatDate(date) === formatDate(selectedDate) ? "default" : "ghost"}
                        size="sm"
                        className="w-full h-8"
                        onClick={() => handleDateSelect(date)}
                        disabled={isDateDisabled(date)}
                      >
                        {date.getDate()}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Time Selection */}
          <div>
            <h4 className="font-medium mb-2">
              {timeOnly ? 'Select Time (8:00 AM - 6:00 PM)' : 'Select Time (8:00 AM - 6:00 PM)'}
            </h4>
            <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
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
                No available time slots
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
