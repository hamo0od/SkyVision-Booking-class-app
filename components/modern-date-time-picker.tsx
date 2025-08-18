"use client"

import { useEffect, useMemo, useState } from "react"
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
  // Helpers
  const pad = (n: number) => n.toString().padStart(2, "0")
  const formatDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const formatTimeDisplay = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const hour12 = hours % 12 || 12
    return `${hour12}:${pad(minutes)} ${period}`
  }
  const timeRangeLabel = (fromHour: number, toHour: number) =>
    `${formatTimeDisplay(`${pad(fromHour)}:00`)} - ${formatTimeDisplay(`${pad(toHour)}:00`)}`

  // Business hours (updated): 07:00 to 23:00
  const MIN_HOUR = 7
  const MAX_HOUR = 23

  // Parse initial value if provided
  const initialDate = value ? value.split("T")[0] : ""
  const initialTime = value ? value.split("T")[1]?.slice(0, 5) : ""

  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedTime, setSelectedTime] = useState(initialTime)
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const today = new Date()

  // Auto-advance to next day if current time is past business hours
  useEffect(() => {
    if (!timeOnly && !selectedDate) {
      const now = new Date()
      const currentHour = now.getHours()
      if (currentHour >= MAX_HOUR) {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        setSelectedDate(formatDate(tomorrow))
      } else {
        setSelectedDate(formatDate(now))
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
      if (date) setSelectedDate(date)
    }
  }, [timeOnly, linkedDate])

  // Update parent when selection changes
  useEffect(() => {
    if (selectedTime && selectedDate) {
      const dateToUse = timeOnly && linkedDate ? linkedDate.split("T")[0] : selectedDate
      if (dateToUse) onChange?.(`${dateToUse}T${selectedTime}`)
    }
  }, [selectedDate, selectedTime, onChange, timeOnly, linkedDate])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day))
    return days
  }

  const isDateDisabled = (date: Date) => {
    const minDate = min ? new Date(min) : new Date()
    const d1 = new Date(minDate)
    const d2 = new Date(date)
    d1.setHours(0, 0, 0, 0)
    d2.setHours(0, 0, 0, 0)
    return d2 < d1
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() + (direction === "prev" ? -1 : 1))
      return newMonth
    })
  }

  // Generate time slots from 07:00 to 23:00 in 30-minute intervals (includes 23:00, excludes 23:30)
  const generateTimeSlots = () => {
    const slots: string[] = []
    for (let hour = MIN_HOUR; hour <= MAX_HOUR; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === MAX_HOUR && minute > 0) continue
        slots.push(`${pad(hour)}:${pad(minute)}`)
      }
    }
    return slots
  }

  // Get available time slots based on selected date and time-only mode
  const availableTimeSlots = useMemo(() => {
    const allSlots = generateTimeSlots()
    if (!selectedDate) return allSlots

    // For time-only mode (bulk booking), always start from 7 AM
    if (timeOnly) {
      return allSlots
    }

    // For regular booking, filter past times if it's today
    const sel = new Date(`${selectedDate}T00:00:00`)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // If selected date is today, filter out past times (round up to next half-hour)
    if (sel.getTime() === todayStart.getTime()) {
      const now = new Date()
      const minutesNow = now.getHours() * 60 + now.getMinutes()
      const nextHalfHour = Math.ceil(minutesNow / 30) * 30
      return allSlots.filter((slot) => {
        const [hh, mm] = slot.split(":").map(Number)
        const mins = hh * 60 + mm
        return mins > nextHalfHour
      })
    }
    return allSlots
  }, [selectedDate, timeOnly])

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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(formatDate(date))
    setShowCalendar(false)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
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
                <span>{`Select Time (${timeRangeLabel(MIN_HOUR, MAX_HOUR)})`}</span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                {availableTimeSlots.map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={selectedTime === t ? "default" : "ghost"}
                    className={`w-full justify-start text-left font-normal rounded-none border-0 text-sm ${
                      selectedTime === t ? "bg-blue-600 text-white" : "hover:bg-blue-50"
                    }`}
                    onClick={() => handleTimeSelect(t)}
                  >
                    {formatTimeDisplay(t)}
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
                    className="w-full justify-start text-left font-normal text-sm bg-transparent"
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
                        {getDaysInMonth(currentMonth).map((date, index) => (
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
                  <span>{`Select Time (${timeRangeLabel(MIN_HOUR, MAX_HOUR)})`}</span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                  {availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map((t) => (
                      <Button
                        key={t}
                        type="button"
                        variant={selectedTime === t ? "default" : "ghost"}
                        className={`w-full justify-start text-left font-normal rounded-none border-0 text-sm ${
                          selectedTime === t ? "bg-blue-600 text-white" : "hover:bg-blue-50"
                        }`}
                        onClick={() => handleTimeSelect(t)}
                      >
                        {formatTimeDisplay(t)}
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
