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
  timeOnly?: boolean
  linkedDate?: string
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
  // Parse initial value if provided
  const initialDate = value ? value.split("T")[0] : ""
  const initialTime = value ? value.split("T")[1]?.slice(0, 5) : ""

  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedTime, setSelectedTime] = useState(initialTime)
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const today = new Date()
  const minDate = min ? new Date(min) : today

  // Auto-advance to next day if current time is past business hours
  useEffect(() => {
    if (!timeOnly && !selectedDate) {
      const now = new Date()
      const currentHour = now.getHours()

      // If it's past 6 PM (18:00), automatically set to next day
      if (currentHour >= 18) {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowString = formatDate(tomorrow)
        setSelectedDate(tomorrowString)
      } else {
        // Set to today if within business hours
        const todayString = formatDate(now)
        setSelectedDate(todayString)
      }
    }
  }, [timeOnly, selectedDate])

  // Update when value prop changes
  useEffect(() => {
    if (value) {
      const [date, time] = value.split("T")
      setSelectedDate(date)
      setSelectedTime(time?.slice(0, 5) || "")
    }
  }, [value])

  // In time-only mode, use the linked date
  useEffect(() => {
    if (timeOnly && linkedDate) {
      const date = linkedDate.split("T")[0]
      if (date) {
        setSelectedDate(date)
      }
    }
  }, [timeOnly, linkedDate])

  // Update parent when selection changes
  useEffect(() => {
    if (selectedTime && selectedDate) {
      let dateToUse = selectedDate

      // In time-only mode, use the linked date
      if (timeOnly && linkedDate) {
        dateToUse = linkedDate.split("T")[0]
      }

      if (dateToUse) {
        const datetime = `${dateToUse}T${selectedTime}`
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

  // Format date to YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Check if a date should be disabled
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
    const formattedDate = formatDate(date)
    setSelectedDate(formattedDate)
    setShowCalendar(false)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
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

  // Generate time slots from 8:00 AM to 6:00 PM in 30-minute intervals
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip 6:30 PM
        if (hour === 18 && minute > 0) continue

        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        slots.push(timeString)
      }
    }
    return slots
  }

  // Get available time slots based on selected date
  const getAvailableTimeSlots = () => {
    const allSlots = generateTimeSlots()

    // If no date selected, return all slots
    if (!selectedDate) return allSlots

    const selectedDateObj = new Date(selectedDate + "T00:00:00")
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // If selected date is today, filter out past times
    if (selectedDateObj.getTime() === today.getTime()) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTimeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`

      return allSlots.filter((slot) => slot > currentTimeString)
    }

    // For future dates, return all slots
    return allSlots
  }

  const availableTimeSlots = getAvailableTimeSlots()

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

  // Display selected date in a readable format
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

  // Format time for display (12-hour format)
  const formatTimeDisplay = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const hour12 = hours % 12 || 12
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`
  }

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
                <span>Select Time (8:00 AM - 6:00 PM)</span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                {availableTimeSlots.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant={selectedTime === time ? "default" : "ghost"}
                    className={`w-full justify-start text-left font-normal rounded-none border-0 text-sm ${
                      selectedTime === time ? "bg-blue-600 text-white" : "hover:bg-blue-50"
                    }`}
                    onClick={() => handleTimeSelect(time)}
                  >
                    {formatTimeDisplay(time)}
                  </Button>
                ))}
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
                  <span>Select Time (8:00 AM - 6:00 PM)</span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                  {availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={selectedTime === time ? "default" : "ghost"}
                        className={`w-full justify-start text-left font-normal rounded-none border-0 text-sm ${
                          selectedTime === time ? "bg-blue-600 text-white" : "hover:bg-blue-50"
                        }`}
                        onClick={() => handleTimeSelect(time)}
                      >
                        {formatTimeDisplay(time)}
                      </Button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">No available time slots for this date</div>
                  )}
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
