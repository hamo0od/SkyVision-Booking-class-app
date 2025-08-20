"use client"

import type React from "react"
import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"

interface SimpleDateTimePickerProps {
  label?: string
  icon?: React.ReactNode
  value?: Date | null
  onChange?: (date: Date | null) => void
  name?: string
  required?: boolean
  minTime?: string
  timeOnly?: boolean
}

export function SimpleDateTimePicker({
  label,
  icon,
  value,
  onChange,
  name,
  required = false,
  minTime,
  timeOnly = false,
}: SimpleDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Generate 30-minute time intervals from 7:00 AM to 11:00 PM
  const generateTimeOptions = () => {
    const options: { value: string; label: string }[] = []
    const startHour = 7
    const endHour = 23

    for (let hour = startHour; hour <= endHour; hour++) {
      const minutes = hour === endHour ? [0] : [0, 30]
      for (const minute of minutes) {
        const timeValue = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        const ampm = hour >= 12 ? "PM" : "AM"
        const timeLabel = `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm}`

        options.push({ value: timeValue, label: timeLabel })
      }
    }
    return options
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

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

        // Set to next 30-minute interval
        let nextHour = currentHour
        const nextMinute = currentMinute <= 30 ? 30 : 0
        if (nextMinute === 0) {
          nextHour += 1
        }

        newDate.setHours(nextHour, nextMinute, 0, 0)
      } else {
        // For future dates, preserve the existing time or set default
        newDate.setHours(value.getHours(), value.getMinutes(), value.getSeconds())
      }
      onChange?.(newDate)
    } else {
      // No existing time, set appropriate default
      if (selectedDate.getTime() === today.getTime()) {
        // If selecting today, set to next available 30-minute slot
        const now = new Date()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()

        let nextHour = currentHour
        const nextMinute = currentMinute <= 30 ? 30 : 0
        if (nextMinute === 0) {
          nextHour += 1
        }

        date.setHours(nextHour, nextMinute, 0, 0)
      } else {
        // For future dates, set to 9:00 AM
        date.setHours(9, 0, 0, 0)
      }
      onChange?.(date)
    }
    setIsOpen(false)
  }

  const handleTimeChange = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number)

    if (timeOnly) {
      // For time-only mode, create a date with today's date but the specified time
      const newDate = new Date()
      newDate.setHours(hours, minutes, 0, 0)
      onChange?.(newDate)
    } else if (value) {
      // For datetime mode, update the time part of the existing date
      const newDate = new Date(value)
      newDate.setHours(hours, minutes, 0, 0)
      onChange?.(newDate)
    }
  }

  const formatTime = (date: Date) => {
    return date.toTimeString().slice(0, 5) // HH:MM format
  }

  const formatDisplayDate = (date: Date) => {
    return format(date, "PPP") // e.g., "Jan 1, 2024"
  }

  // Filter time options based on minimum time if it's today
  const getAvailableTimeOptions = () => {
    const timeOptions = generateTimeOptions()

    if (!value || !minTime) return timeOptions

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(value)
    selectedDate.setHours(0, 0, 0, 0)

    // If it's today, filter out past times
    if (selectedDate.getTime() === today.getTime()) {
      return timeOptions.filter((option) => option.value >= minTime)
    }

    return timeOptions
  }

  const timeOptions = getAvailableTimeOptions()
  const currentTimeValue = value ? formatTime(value) : ""

  // For time-only mode, just show time selector
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
        <Select value={currentTimeValue} onValueChange={handleTimeChange}>
          <SelectTrigger className="bg-white">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <SelectValue placeholder="--:-- --" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {name && <input type="hidden" name={name} value={value?.toISOString() || ""} />}
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
            <Button variant="outline" className="flex-1 justify-start text-left font-normal bg-white">
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

        {/* Time Selector */}
        <div className="flex-1">
          <Select value={currentTimeValue} onValueChange={handleTimeChange} disabled={!value}>
            <SelectTrigger className="bg-white">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <SelectValue placeholder="--:-- --" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {name && <input type="hidden" name={name} value={value?.toISOString() || ""} />}
    </div>
  )
}
