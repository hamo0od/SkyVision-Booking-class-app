"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface ModernDateTimePickerProps {
  mode: "datetime" | "multiple-dates" | "time-only"
  value?: Date
  onChange?: (date: Date | undefined) => void
  selectedDates?: string[]
  onDatesChange?: (dates: string[]) => void
  startTime?: Date
  endTime?: Date
  onStartTimeChange?: (time: Date | undefined) => void
  onEndTimeChange?: (time: Date | undefined) => void
}

export function ModernDateTimePicker({
  mode,
  value,
  onChange,
  selectedDates = [],
  onDatesChange,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: ModernDateTimePickerProps) {
  const [tempDate, setTempDate] = useState("")
  const [tempStartTime, setTempStartTime] = useState("")
  const [tempEndTime, setTempEndTime] = useState("")

  // Initialize time fields when mode changes or for bulk bookings
  useEffect(() => {
    if (mode === "multiple-dates" || mode === "time-only") {
      // Set default times to 7 AM - 8 AM for bulk bookings
      if (!startTime) {
        const defaultStart = new Date()
        defaultStart.setHours(7, 0, 0, 0)
        onStartTimeChange?.(defaultStart)
        setTempStartTime("07:00")
      } else {
        setTempStartTime(startTime.toTimeString().slice(0, 5))
      }

      if (!endTime) {
        const defaultEnd = new Date()
        defaultEnd.setHours(8, 0, 0, 0)
        onEndTimeChange?.(defaultEnd)
        setTempEndTime("08:00")
      } else {
        setTempEndTime(endTime.toTimeString().slice(0, 5))
      }
    }
  }, [mode, startTime, endTime, onStartTimeChange, onEndTimeChange])

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const formatDateOnly = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateTime = e.target.value
    if (dateTime && onChange) {
      onChange(new Date(dateTime))
    }
  }

  const handleDateAdd = () => {
    if (tempDate && onDatesChange) {
      if (!selectedDates.includes(tempDate)) {
        onDatesChange([...selectedDates, tempDate].sort())
      }
      setTempDate("")
    }
  }

  const handleDateRemove = (dateToRemove: string) => {
    if (onDatesChange) {
      onDatesChange(selectedDates.filter((date) => date !== dateToRemove))
    }
  }

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    setTempStartTime(timeValue)

    if (timeValue && onStartTimeChange) {
      const [hours, minutes] = timeValue.split(":").map(Number)
      const newTime = new Date()
      newTime.setHours(hours, minutes, 0, 0)
      onStartTimeChange(newTime)
    }
  }

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    setTempEndTime(timeValue)

    if (timeValue && onEndTimeChange) {
      const [hours, minutes] = timeValue.split(":").map(Number)
      const newTime = new Date()
      newTime.setHours(hours, minutes, 0, 0)
      onEndTimeChange(newTime)
    }
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return formatDateOnly(tomorrow)
  }

  if (mode === "datetime") {
    return (
      <Input
        type="datetime-local"
        value={value ? formatDateForInput(value) : ""}
        onChange={handleDateTimeChange}
        min={formatDateForInput(new Date())}
      />
    )
  }

  if (mode === "multiple-dates") {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="date"
            value={tempDate}
            onChange={(e) => setTempDate(e.target.value)}
            min={getTomorrowDate()}
            placeholder="Select date"
          />
          <Button type="button" onClick={handleDateAdd} disabled={!tempDate}>
            Add Date
          </Button>
        </div>

        {selectedDates.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Dates:</Label>
            <div className="flex flex-wrap gap-2">
              {selectedDates.map((date) => (
                <Badge key={date} variant="secondary" className="flex items-center gap-1">
                  {new Date(date).toLocaleDateString()}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleDateRemove(date)} />
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input type="time" value={tempStartTime} onChange={handleStartTimeChange} />
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <Input type="time" value={tempEndTime} onChange={handleEndTimeChange} />
          </div>
        </div>
      </div>
    )
  }

  if (mode === "time-only") {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Time</Label>
          <Input type="time" value={tempStartTime} onChange={handleStartTimeChange} />
        </div>
        <div className="space-y-2">
          <Label>End Time</Label>
          <Input type="time" value={tempEndTime} onChange={handleEndTimeChange} />
        </div>
      </div>
    )
  }

  return null
}
