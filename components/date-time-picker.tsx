"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock } from "lucide-react"

interface DateTimePickerProps {
  label: string
  name: string
  value?: string
  onChange?: (value: string) => void
  min?: string
  required?: boolean
}

export function DateTimePicker({ label, name, value, onChange, min, required }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState(value?.split("T")[0] || "")
  const [selectedTime, setSelectedTime] = useState(value?.split("T")[1]?.slice(0, 5) || "")

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    if (selectedTime) {
      const datetime = `${date}T${selectedTime}`
      onChange?.(datetime)
    }
  }

  const handleTimeChange = (time: string) => {
    setSelectedTime(time)
    if (selectedDate) {
      const datetime = `${selectedDate}T${time}`
      onChange?.(datetime)
    }
  }

  const combinedValue = selectedDate && selectedTime ? `${selectedDate}T${selectedTime}` : ""

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
      </Label>
      <Card className="p-3">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Date</span>
              </div>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={min?.split("T")[0]}
                required={required}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Time</span>
              </div>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                required={required}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={combinedValue} />
    </div>
  )
}
