"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { CalendarIcon } from "lucide-react"

interface BulkDatePickerProps {
  selectedDates: string[]
  onSelectedDatesChange: (dates: string[]) => void
}

export function BulkDatePicker({ selectedDates, onSelectedDatesChange }: BulkDatePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    const dateString = date.toISOString().split("T")[0] // YYYY-MM-DD format

    if (selectedDates.includes(dateString)) {
      // Remove date if already selected
      onSelectedDatesChange(selectedDates.filter((d) => d !== dateString))
    } else {
      // Add date if not selected
      onSelectedDatesChange([...selectedDates, dateString].sort())
    }
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const isDateSelected = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    return selectedDates.includes(dateString)
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <CalendarIcon className="h-4 w-4" />
        Select Dates *
      </Label>
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal bg-white" type="button">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDates.length === 0
              ? "Select dates"
              : `${selectedDates.length} date${selectedDates.length === 1 ? "" : "s"} selected`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            modifiers={{
              selected: isDateSelected,
            }}
            modifiersStyles={{
              selected: {
                backgroundColor: "#3b82f6",
                color: "white",
              },
            }}
            initialFocus
          />
          <div className="p-3 border-t">
            <p className="text-sm text-gray-600">Click dates to select/deselect. {selectedDates.length} selected.</p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
