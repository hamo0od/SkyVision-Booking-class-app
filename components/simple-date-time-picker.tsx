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
  minTime?: string
  timeOnly?: boolean
  dateOnly?: boolean
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
  dateOnly = false,
}: SimpleDateTimePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

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

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      if (dateOnly) {
        onChange(selectedDate)
      } else {
        // If we have an existing time, preserve it
        if (value) {
          const newDate = new Date(selectedDate)
          newDate.setHours(value.getHours(), value.getMinutes(), 0, 0)
          onChange(newDate)
        } else {
          // Set default time to 9 AM
          const newDate = new Date(selectedDate)
          newDate.setHours(9, 0, 0, 0)
          onChange(newDate)
        }
      }
      setIsCalendarOpen(false)
    }
  }

  const handleTimeSelect = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number)

    if (timeOnly) {
      // For time-only mode, create a new date with today's date
      const newDate = new Date()
      newDate.setHours(hours, minutes, 0, 0)
      onChange(newDate)
    } else {
      // For date+time mode, preserve the existing date
      const newDate = value ? new Date(value) : new Date()
      newDate.setHours(hours, minutes, 0, 0)
      onChange(newDate)
    }
  }

  const isTimeDisabled = (timeString: string) => {
    if (!minTime) return false
    return timeString < minTime
  }

  const formatDisplayValue = () => {
    if (!value) return ""

    if (dateOnly) {
      return format(value, "MMM dd, yyyy")
    } else if (timeOnly) {
      return value.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    } else {
      return `${format(value, "MMM dd, yyyy")} at ${value.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`
    }
  }

  const getPlaceholderText = () => {
    if (dateOnly) return "Pick a date"
    if (timeOnly) return "Select time"
    return "Pick a date and time"
  }

  // For date-only mode
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
              {value ? format(value, "MMM dd, yyyy") : getPlaceholderText()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value || undefined}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  // For time-only mode
  if (timeOnly) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {icon}
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Select value={value ? value.toTimeString().slice(0, 5) : ""} onValueChange={handleTimeSelect}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder={getPlaceholderText()} />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} disabled={isTimeDisabled(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  // For combined date+time mode
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {icon}
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Date Picker */}
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
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Time Picker */}
        <Select value={value ? value.toTimeString().slice(0, 5) : ""} onValueChange={handleTimeSelect}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="--:-- --" />
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} disabled={isTimeDisabled(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
