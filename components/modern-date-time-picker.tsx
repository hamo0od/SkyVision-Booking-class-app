"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react"

interface ModernDateTimePickerProps {
  label: string
  name: string
  value?: string
  onChange?: (value: string) => void
  min?: string
  required?: boolean
  timeOnly?: boolean // New prop for time-only mode
  linkedDate?: string // Date to use when in time-only mode
}

export function ModernDateTimePicker({
  label,
  name,
  value,
  onChange,
  min,
  required,
  timeOnly = false,
  linkedDate,
}: ModernDateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState(value?.split("T")[0] || "")
  const [selectedTime, setSelectedTime] = useState(value?.split("T")[1]?.slice(0, 5) || "")
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const today = new Date()
  const minDate = min ? new Date(min) : today

  useEffect(() => {
    // In time-only mode, use the linked date if provided
    if (timeOnly && linkedDate) {
      const date = linkedDate.split("T")[0]
      setSelectedDate(date)
    }
  }, [timeOnly, linkedDate])

  useEffect(() => {
    if (selectedTime) {
      if (timeOnly && linkedDate) {
        // In time-only mode, combine the linked date with selected time
        const date = linkedDate.split("T")[0]
        const datetime = `${date}T${selectedTime}`
        onChange?.(datetime)
      } else if (selectedDate) {
        // Normal mode - combine selected date and time
        const datetime = `${selectedDate}T${selectedTime}`
        onChange?.(datetime)
      }
    }
  }, [selectedDate, selectedTime, onChange, timeOnly, linkedDate])

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

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  // Fixed: Use local date formatting to avoid timezone issues
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Fixed: Compare dates properly in local timezone
  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)

    if (min) {
      const minDateOnly = new Date(min)
      minDateOnly.setHours(0, 0, 0, 0)
      return compareDate < minDateOnly
    }

    return compareDate < today
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(formatDate(date))
    setShowCalendar(false)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev)
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1)
      } else {
        newMonth.setMonth(prev.getMonth() + 1)
      }
      return newMonth
    })
  }

  // Get time slots from 8 AM to 10 PM in 30-minute intervals
  const timeSlots = []
  for (let hour = 8; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      timeSlots.push(timeString)
    }
  }

  const days = getDaysInMonth(currentMonth)
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Fixed: Display selected date properly in local timezone
  const displaySelectedDate = () => {
    if (!selectedDate) return "Pick a date"

    const [year, month, day] = selectedDate.split("-").map(Number)
    const date = new Date(year, month - 1, day)

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Get minimum time based on min prop
  const getMinTime = () => {
    if (!min) return null

    const minDateTime = new Date(min)
    const now = new Date()

    // If min date is today, return current time
    if (
      minDateTime.getDate() === now.getDate() &&
      minDateTime.getMonth() === now.getMonth() &&
      minDateTime.getFullYear() === now.getFullYear()
    ) {
      return (
        minDateTime.getHours().toString().padStart(2, "0") + ":" + minDateTime.getMinutes().toString().padStart(2, "0")
      )
    }

    return null
  }

  const minTime = getMinTime()

  return (
    <div className="space-y-3">
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </Label>

      <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
        <CardContent className="p-3 sm:p-4">
          {timeOnly ? (
            // Time-only mode
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Select Time</span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                {timeSlots.map((time) => {
                  // Skip times before minimum time if on same day
                  if (minTime && time < minTime) {
                    return null
                  }

                  return (
                    <Button
                      key={time}
                      type="button"
                      variant={selectedTime === time ? "default" : "ghost"}
                      className={`w-full justify-start text-left font-normal rounded-none border-0 text-sm ${
                        selectedTime === time ? "bg-blue-600 text-white" : "hover:bg-blue-50"
                      }`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Button>
                  )
                })}
              </div>
            </div>
          ) : (
            // Date and time mode
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Date Picker */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>Select Date</span>
                </div>

                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-sm"
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    {selectedDate ? displaySelectedDate() : <span className="text-gray-500">Pick a date</span>}
                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                  </Button>

                  {showCalendar && (
                    <div className="absolute top-full left-0 z-50 mt-2 w-full sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 sm:p-4">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-4">
                        <Button type="button" variant="ghost" size="sm" onClick={() => navigateMonth("prev")}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h3 className="font-semibold text-sm sm:text-base">
                          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h3>
                        <Button type="button" variant="ghost" size="sm" onClick={() => navigateMonth("next")}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Day Names */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNames.map((day) => (
                          <div key={day} className="text-center text-xs font-medium text-gray-500 p-1 sm:p-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Days */}
                      <div className="grid grid-cols-7 gap-1">
                        {days.map((date, index) => (
                          <div key={index} className="aspect-square">
                            {date && (
                              <Button
                                type="button"
                                variant={selectedDate === formatDate(date) ? "default" : "ghost"}
                                size="sm"
                                className={`w-full h-full text-xs sm:text-sm ${
                                  isDateDisabled(date) ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-50"
                                } ${selectedDate === formatDate(date) ? "bg-blue-600 text-white" : ""}`}
                                onClick={() => !isDateDisabled(date) && handleDateSelect(date)}
                                disabled={isDateDisabled(date)}
                              >
                                {date.getDate()}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Time Picker */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Select Time</span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                  {timeSlots.map((time) => {
                    // Skip times before minimum time if on same day
                    if (minTime && time < minTime) {
                      return null
                    }

                    return (
                      <Button
                        key={time}
                        type="button"
                        variant={selectedTime === time ? "default" : "ghost"}
                        className={`w-full justify-start text-left font-normal rounded-none border-0 text-sm ${
                          selectedTime === time ? "bg-blue-600 text-white" : "hover:bg-blue-50"
                        }`}
                        onClick={() => setSelectedTime(time)}
                      >
                        {new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={
          timeOnly && linkedDate
            ? `${linkedDate.split("T")[0]}T${selectedTime}`
            : selectedDate && selectedTime
              ? `${selectedDate}T${selectedTime}`
              : ""
        }
        required={required}
      />
    </div>
  )
}
