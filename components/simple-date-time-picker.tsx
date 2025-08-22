"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"

interface SimpleDateTimePickerProps {
  value: string
  onChange: (value: string) => void
  dateOnly?: boolean
  timeOnly?: boolean
}

export function SimpleDateTimePicker({
  value,
  onChange,
  dateOnly = false,
  timeOnly = false,
}: SimpleDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value ? new Date(value) : undefined)
  const [selectedTime, setSelectedTime] = useState(value ? format(new Date(value), "HH:mm") : "")

  // Generate time options (30-minute intervals from 7 AM to 11 PM)
  const generateTimeOptions = () => {
    const times = []
    for (let hour = 7; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time24 = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        const ampm = hour >= 12 ? "PM" : "AM"
        const time12 = `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`
        times.push({ value: time24, label: time12 })
      }
    }
    return times
  }

  const timeOptions = generateTimeOptions()

  // Filter past times if selecting today's date
  const getAvailableTimeOptions = () => {
    if (!value || timeOnly) return timeOptions

    const selectedDate = new Date(value)
    const today = new Date()

    // If selected date is today, filter out past times
    if (selectedDate.toDateString() === today.toDateString()) {
      const currentTime = today.getHours() * 60 + today.getMinutes()
      return timeOptions.filter((option) => {
        const [hour, minute] = option.value.split(":").map(Number)
        const optionTime = hour * 60 + minute
        return optionTime > currentTime
      })
    }

    return timeOptions
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date && selectedTime) {
      const dateTime = new Date(date)
      const [hours, minutes] = selectedTime.split(":").map(Number)
      dateTime.setHours(hours, minutes)
      onChange(dateTime.toISOString())
    }
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    if (selectedDate && time) {
      const dateTime = new Date(selectedDate)
      const [hours, minutes] = time.split(":").map(Number)
      dateTime.setHours(hours, minutes)
      onChange(dateTime.toISOString())
    }
  }

  if (timeOnly) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent>
          {getAvailableTimeOptions().map((time) => (
            <SelectItem key={time.value} value={time.value}>
              {time.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (dateOnly) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(new Date(value), "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, "yyyy-MM-dd"))
                setIsOpen(false)
              }
            }}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  }

  // Combined date and time picker (legacy mode)
  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex-1 justify-start text-left font-normal bg-transparent">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Select value={selectedTime} onValueChange={handleTimeSelect}>
        <SelectTrigger className="flex-1">
          <Clock className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Time" />
        </SelectTrigger>
        <SelectContent>
          {getAvailableTimeOptions().map((time) => (
            <SelectItem key={time.value} value={time.value}>
              {time.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
