"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

  const handleTimeChange = (timeString: string) => {
    if (timeOnly) {
      // For time-only mode, create a date with today's date but the specified time
      const [hours, minutes] = timeString.split(":").map(Number)
      const newDate = new Date()
      newDate.setHours(hours, minutes, 0, 0)
      onChange?.(newDate)
    } else if (value) {
      // For datetime mode, update the time part of the existing date
      const [hours, minutes] = timeString.split(":").map(Number)
      const newDate = new Date(value)
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
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(date)
      selectedDate.setHours(0, 0, 0, 0)

      if (value) {
        // Preserve time if it exists, but adjust if selecting today
        const newDate = new Date(date)
        if (selectedDate.getTime() === today.getTime()) {
          // If selecting today, ensure time is not in the past
          const now = new Date()
          const currentHour = now.getHours()
          const currentMinute = now.getMinutes()

          // Set to next hour if current time has passed
          newDate.setHours(currentHour + 1, 0, 0, 0)
        } else {
          // For future dates, preserve the existing time or set default
          newDate.setHours(value.getHours(), value.getMinutes(), value.getSeconds())
        }
        onChange?.(newDate)
      } else {
        // No existing time, set appropriate default
        if (selectedDate.getTime() === today.getTime()) {
          // If selecting today, set to next hour
          const now = new Date()
          date.setHours(now.getHours() + 1, 0, 0, 0)
        } else {
          // For future dates, set to 9 AM
          date.setHours(9, 0, 0, 0)
        }
        onChange?.(date)
      }
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

  // Custom day renderer to highlight past dates in red
  const dayRenderer = (day: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayToCheck = new Date(day)
    dayToCheck.setHours(0, 0, 0, 0)

    const isPast = dayToCheck < today
    const isSelected = isBulkBooking ? selectedDates.includes(format(day, "yyyy-MM-dd")) : false

    return (
      <div
        className={`
        w-full h-full flex items-center justify-center
        ${isPast ? "text-red-500 bg-red-50" : ""}
        ${isSelected ? "bg-blue-100 text-blue-900 font-semibold" : ""}
      `}
      >
        {day.getDate()}
      </div>
    )
  }

  // Get minimum time for today
  const getMinTime = () => {
    if (value && format(value, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")) {
      const now = new Date()
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000) // Add 1 hour
      return format(nextHour, "HH:mm")
    }
    return undefined
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

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {icon}
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="flex gap-2">
        {/* Date Picker */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 justify-start text-left font-normal bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? formatDisplayDate(value) : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value || undefined}
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

        {/* Time Input */}
        <div className="flex items-center gap-1 px-3 py-2 border rounded-md bg-white min-w-[100px]">
          <Clock className="h-4 w-4 text-gray-400" />
          <Input
            type="time"
            value={value ? formatTime(value) : ""}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="border-0 p-0 h-auto focus-visible:ring-0 text-sm"
            required={required}
            min={getMinTime()}
          />
        </div>
      </div>

      {name && <input type="hidden" name={name} value={value?.toISOString() || ""} />}
    </div>
  )
}
