"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, X } from "lucide-react"
import { format } from "date-fns"

interface ModernDateTimePickerProps {
  label?: string
  icon?: React.ReactNode
  value?: Date | null
  onChange?: (date: Date | null) => void
  name?: string
  required?: boolean
  isBulkBooking?: boolean
  selectedDates?: string[]
  onSelectedDatesChange?: (dates: string[]) => void
  timeOnly?: boolean
  isStartTime?: boolean
  isEndTime?: boolean
  startTime?: Date | null
  selectedDate?: Date | null
  onDateChange?: (date: Date | null) => void
}

export function ModernDateTimePicker({
  label,
  icon,
  value,
  onChange,
  name,
  required = false,
  isBulkBooking = false,
  selectedDates = [],
  onSelectedDatesChange,
  timeOnly = false,
  isStartTime = false,
  isEndTime = false,
  startTime,
  selectedDate,
  onDateChange,
}: ModernDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCalendarDates, setSelectedCalendarDates] = useState<Date[]>([])

  // Convert string dates to Date objects for calendar
  useEffect(() => {
    if (isBulkBooking && selectedDates.length > 0) {
      const dates = selectedDates.map((dateStr) => new Date(dateStr))
      setSelectedCalendarDates(dates)
    }
  }, [selectedDates, isBulkBooking])

  // Generate time slots in 30-minute intervals
  const generateTimeSlots = () => {
    const slots = []
    const now = new Date()
    const isToday = selectedDate && format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")

    for (let hour = 7; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = new Date()
        timeSlot.setHours(hour, minute, 0, 0)

        // If it's today, only show future time slots
        if (isToday) {
          const currentTime = new Date()
          currentTime.setMinutes(currentTime.getMinutes() + 60) // Add 1 hour buffer
          if (timeSlot <= currentTime) {
            continue
          }
        }

        // For end time, only show slots after start time
        if (isEndTime && startTime) {
          const startTimeSlot = new Date()
          startTimeSlot.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0)
          if (timeSlot <= startTimeSlot) {
            continue
          }
        }

        slots.push({
          value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          label: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          time: timeSlot,
        })
      }
    }

    return slots
  }

  const handleTimeChange = (timeString: string) => {
    if (timeOnly) {
      // For time-only mode, create a date with today's date but the specified time
      const [hours, minutes] = timeString.split(":").map(Number)
      const newDate = new Date()
      newDate.setHours(hours, minutes, 0, 0)
      onChange?.(newDate)
    } else if (selectedDate) {
      // For datetime mode with selected date, update the time part
      const [hours, minutes] = timeString.split(":").map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes, 0, 0)
      onChange?.(newDate)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    if (isBulkBooking) {
      // Handle multiple date selection for bulk booking
      const dateString = format(date, "yyyy-MM-dd")
      const currentDates = [...selectedDates]

      if (currentDates.includes(dateString)) {
        // Remove date if already selected
        const newDates = currentDates.filter((d) => d !== dateString)
        onSelectedDatesChange?.(newDates)
      } else {
        // Add date if not selected
        const newDates = [...currentDates, dateString].sort()
        onSelectedDatesChange?.(newDates)
      }
    } else {
      // Handle single date selection
      onDateChange?.(date)
      setIsOpen(false)
    }
  }

  const removeBulkDate = (dateToRemove: string) => {
    const newDates = selectedDates.filter((date) => date !== dateToRemove)
    onSelectedDatesChange?.(newDates)
  }

  const formatTime = (date: Date) => {
    return date.toTimeString().slice(0, 5) // HH:MM format
  }

  const formatDisplayDate = (date: Date) => {
    return format(date, "PPP") // e.g., "Jan 1, 2024"
  }

  if (timeOnly) {
    return (
      <div className="space-y-2">
        {label && (
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            {icon}
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Input
          type="time"
          value={value ? formatTime(value) : "07:00"}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="w-full"
          required={required}
        />
        {name && <input type="hidden" name={name} value={value?.toISOString() || ""} />}
      </div>
    )
  }

  if (isBulkBooking) {
    return (
      <div className="space-y-4">
        {label && (
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            {icon}
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
        )}

        {/* Date Selection */}
        <div className="space-y-2">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDates.length > 0 ? `${selectedDates.length} dates selected` : "Select dates"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="multiple"
                selected={selectedCalendarDates}
                onSelect={(dates) => {
                  if (dates) {
                    const dateStrings = dates.map((date) => format(date, "yyyy-MM-dd")).sort()
                    onSelectedDatesChange?.(dateStrings)
                  }
                }}
                disabled={(date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return date < today
                }}
                modifiers={{
                  past: (date) => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    return date < today
                  },
                }}
                modifiersStyles={{
                  past: {
                    color: "#dc2626",
                    backgroundColor: "#fef2f2",
                  },
                }}
                initialFocus
              />
              <div className="p-3 border-t">
                <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 bg-red-50 border border-red-200 rounded"></span>
                  Past dates (unavailable)
                </div>
                <Button onClick={() => setIsOpen(false)} className="w-full" size="sm">
                  Done
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Selected Dates Display */}
        {selectedDates.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">Selected Dates:</Label>
            <div className="flex flex-wrap gap-2">
              {selectedDates.map((dateStr) => (
                <div
                  key={dateStr}
                  className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm"
                >
                  <span>{format(new Date(dateStr), "MMM d, yyyy")}</span>
                  <button
                    type="button"
                    onClick={() => removeBulkDate(dateStr)}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // For single date selection (non-bulk)
  if (!isStartTime && !isEndTime) {
    return (
      <div className="space-y-2">
        {label && (
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            {icon}
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
        )}

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? formatDisplayDate(selectedDate) : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleDateSelect}
              disabled={(date) => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return date < today
              }}
              modifiers={{
                past: (date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return date < today
                },
              }}
              modifiersStyles={{
                past: {
                  color: "#dc2626",
                  backgroundColor: "#fef2f2",
                },
              }}
              initialFocus
            />
            <div className="p-3 border-t">
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-red-50 border border-red-200 rounded"></span>
                Past dates (unavailable)
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {name && <input type="hidden" name={name} value={selectedDate?.toISOString() || ""} />}
      </div>
    )
  }

  // For time selection (start/end time)
  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {icon}
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <Select value={value ? formatTime(value) : ""} onValueChange={handleTimeChange} disabled={!selectedDate}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <SelectValue placeholder={selectedDate ? "Select time" : "Select date first"} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {generateTimeSlots().map((slot) => (
            <SelectItem key={slot.value} value={slot.value}>
              {slot.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {name && <input type="hidden" name={name} value={value?.toISOString() || ""} />}
    </div>
  )
}
