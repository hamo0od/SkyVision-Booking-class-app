'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ModernDateTimePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  timeOnly?: boolean
  linkedDate?: string
  disabled?: boolean
}

export function ModernDateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time",
  timeOnly = false,
  linkedDate,
  disabled = false
}: ModernDateTimePickerProps) {
  const [date, setDate] = useState<Date | undefined>()
  const [time, setTime] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Parse initial value
  useEffect(() => {
    if (value) {
      if (timeOnly) {
        setTime(value)
      } else {
        const dateObj = new Date(value)
        if (!isNaN(dateObj.getTime())) {
          setDate(dateObj)
          setTime(format(dateObj, 'HH:mm'))
        }
      }
    }
  }, [value, timeOnly])

  // Use linked date for time-only picker
  useEffect(() => {
    if (timeOnly && linkedDate) {
      const linkedDateObj = new Date(linkedDate)
      if (!isNaN(linkedDateObj.getTime())) {
        setDate(linkedDateObj)
      }
    }
  }, [timeOnly, linkedDate])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate)
      if (time) {
        const [hours, minutes] = time.split(':')
        selectedDate.setHours(parseInt(hours), parseInt(minutes))
        onChange(selectedDate.toISOString())
      }
    }
  }

  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    if (timeOnly) {
      onChange(newTime)
    } else if (date) {
      const [hours, minutes] = newTime.split(':')
      const newDate = new Date(date)
      newDate.setHours(parseInt(hours), parseInt(minutes))
      onChange(newDate.toISOString())
    }
  }

  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        options.push(timeString)
      }
    }
    return options
  }

  const displayValue = () => {
    if (timeOnly) {
      return time || placeholder
    }
    if (date && time) {
      return `${format(date, 'PPP')} at ${time}`
    }
    if (date) {
      return format(date, 'PPP')
    }
    return placeholder
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          {timeOnly ? <Clock className="mr-2 h-4 w-4" /> : <CalendarIcon className="mr-2 h-4 w-4" />}
          {displayValue()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          {!timeOnly && (
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Time</label>
            <Select value={time} onValueChange={handleTimeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {generateTimeOptions().map((timeOption) => (
                  <SelectItem key={timeOption} value={timeOption}>
                    {timeOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={() => setIsOpen(false)} 
            className="w-full"
            size="sm"
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
