"use client"

import type React from "react"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { format } from "date-fns"

interface SimpleDateTimePickerProps {
  label: string
  icon?: React.ReactNode
  value: Date | null
  onChange: (date: Date | null) => void
  name?: string
  required?: boolean
  timeOnly?: boolean
  dateOnly?: boolean
  minTime?: string
}

// Generate time options in 30-minute intervals from 7 AM to 11 PM
const generateTimeOptions = () => {
  const options = []
  for (let hour = 7; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = new Date()
      time.setHours(hour, minute, 0, 0)
      const timeString = time.toTimeString().slice(0, 5)
      const displayTime = time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      options.push({ value: timeString, label: displayTime })
    }
  }
  return options
}

const timeOptions = generateTimeOptions()

export function SimpleDateTimePicker({
  label,
  icon,
  value,
  onChange,
  name,
  required = false,
  timeOnly = false,
  dateOnly = false,
  minTime,
}: SimpleDateTimePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      if (timeOnly) {
        // For time-only mode, just update the time part
        onChange(date)
      } else if (dateOnly) {
        // For date-only mode, set time to start of day
        const newDate = new Date(date)
        newDate.setHours(0, 0, 0, 0)
        onChange(newDate)
      } else {
        // For combined mode, preserve existing time if any
        const newDate = new Date(date)
        if (value) {
          newDate.setHours(value.getHours(), value.getMinutes(), 0, 0)
        }
        onChange(newDate)
      }
    }
    setIsCalendarOpen(false)
  }

  const handleTimeChange = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number)
    const newDate = new Date()

    if (timeOnly) {
      // For time-only mode, use today's date with selected time
      newDate.setHours(hours, minutes, 0, 0)
    } else if (value) {
      // Preserve the existing date, update time
      newDate.setTime(value.getTime())
      newDate.setHours(hours, minutes, 0, 0)
    } else {
      // No existing date, use today with selected time
      newDate.setHours(hours, minutes, 0, 0)
    }

    onChange(newDate)
  }

  const getFilteredTimeOptions = () => {
    if (!minTime) return timeOptions

    return timeOptions.filter((option) => {
      return option.value >= minTime
    })
  }

  const getCurrentTimeValue = () => {
    if (!value) return ""
    return value.toTimeString().slice(0, 5)
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  if (timeOnly) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {icon}
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Select value={getCurrentTimeValue()} onValueChange={handleTimeChange} required={required}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="--:-- --" />
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectTrigger>
          <SelectContent>
            {getFilteredTimeOptions().map((option) => (
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

  if (dateOnly) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {icon}
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal bg-white" type="button">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value || undefined}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {name && <input type="hidden" name={name} value={value?.toISOString() || ""} />}
      </div>
    )
  }

  // Combined date and time picker
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {icon}
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal bg-white" type="button">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value, "MMM dd") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value || undefined}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Select value={getCurrentTimeValue()} onValueChange={handleTimeChange} required={required}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="--:-- --" />
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectTrigger>
          <SelectContent>
            {getFilteredTimeOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {name && <input type="hidden" name={name} value={value?.toISOString() || ""} />}
    </div>
  )
}
