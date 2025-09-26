"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"

interface ModernDateTimePickerProps {
  value?: Date
  onChange?: (date: Date) => void
  name?: string
  required?: boolean
}

export function ModernDateTimePicker({ value, onChange, name, required = false }: ModernDateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value)
  const [selectedTime, setSelectedTime] = useState<string>(value ? format(value, "HH:mm") : "09:00")
  const [isOpen, setIsOpen] = useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    setSelectedDate(date)

    // Combine date and time
    const [hours, minutes] = selectedTime.split(":").map(Number)
    const newDateTime = new Date(date)
    newDateTime.setHours(hours, minutes, 0, 0)

    onChange?.(newDateTime)
    setIsOpen(false)
  }

  const handleTimeChange = (time: string) => {
    setSelectedTime(time)

    if (selectedDate) {
      const [hours, minutes] = time.split(":").map(Number)
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(hours, minutes, 0, 0)

      onChange?.(newDateTime)
    }
  }

  const combinedDateTime =
    selectedDate && selectedTime
      ? (() => {
          const [hours, minutes] = selectedTime.split(":").map(Number)
          const combined = new Date(selectedDate)
          combined.setHours(hours, minutes, 0, 0)
          return combined
        })()
      : undefined

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Date Picker */}
        <div className="flex-1">
          <Label className="text-sm font-medium text-gray-700">Date</Label>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return date < today
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Picker */}
        <div className="w-32">
          <Label className="text-sm font-medium text-gray-700">Time</Label>
          <div className="flex items-center gap-1 px-3 py-2 border rounded-md bg-white">
            <Clock className="h-4 w-4 text-gray-400" />
            <Input
              type="time"
              value={selectedTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="border-0 p-0 h-auto focus-visible:ring-0 text-sm"
              required={required}
            />
          </div>
        </div>
      </div>

      {/* Hidden inputs for form submission */}
      {name && combinedDateTime && (
        <>
          <input type="hidden" name="startTime" value={combinedDateTime.toISOString()} />
          <input
            type="hidden"
            name="endTime"
            value={new Date(combinedDateTime.getTime() + 60 * 60 * 1000).toISOString()}
          />
        </>
      )}
    </div>
  )
}
