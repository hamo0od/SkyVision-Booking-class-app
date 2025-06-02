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
}

export function ModernDateTimePicker({ label, name, value, onChange, min, required }: ModernDateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState(value?.split("T")[0] || "")
  const [selectedTime, setSelectedTime] = useState(value?.split("T")[1]?.slice(0, 5) || "")
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const today = new Date()
  const minDate = min ? new Date(min) : today

  useEffect(() => {
    if (selectedDate && selectedTime) {
      const datetime = `${selectedDate}T${selectedTime}`
      onChange?.(datetime)
    }
  }, [selectedDate, selectedTime, onChange])

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

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const isDateDisabled = (date: Date) => {
    return date < minDate
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

  return (
    <div className="space-y-3">
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </Label>

      <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full justify-start text-left font-normal"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  {selectedDate ? (
                    new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  ) : (
                    <span className="text-gray-500">Pick a date</span>
                  )}
                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                </Button>

                {showCalendar && (
                  <div className="absolute top-full left-0 z-50 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <Button type="button" variant="ghost" size="sm" onClick={() => navigateMonth("prev")}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <h3 className="font-semibold">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </h3>
                      <Button type="button" variant="ghost" size="sm" onClick={() => navigateMonth("next")}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Day Names */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {dayNames.map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
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
                              className={`w-full h-full text-sm ${
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
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant={selectedTime === time ? "default" : "ghost"}
                    className={`w-full justify-start text-left font-normal rounded-none border-0 ${
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
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={selectedDate && selectedTime ? `${selectedDate}T${selectedTime}` : ""}
        required={required}
      />
    </div>
  )
}
