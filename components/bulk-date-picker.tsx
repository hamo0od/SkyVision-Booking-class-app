"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

interface BulkDatePickerProps {
  selectedDates: string[]
  onSelectedDatesChange: (dates: string[]) => void
}

export function BulkDatePicker({ selectedDates, onSelectedDatesChange }: BulkDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Convert string dates to Date objects for calendar
  const selectedCalendarDates = selectedDates.map((dateStr) => new Date(dateStr))

  const handleDateSelect = (dates: Date[] | undefined) => {
    if (dates) {
      const dateStrings = dates.map((date) => format(date, "yyyy-MM-dd")).sort()
      onSelectedDatesChange(dateStrings)
    } else {
      onSelectedDatesChange([])
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <CalendarIcon className="h-4 w-4" />
        Select Multiple Dates *
      </Label>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal bg-white">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDates.length > 0 ? `${selectedDates.length} dates selected` : "Select dates"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="multiple"
            selected={selectedCalendarDates}
            onSelect={handleDateSelect}
            disabled={(date) => {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              return date < today
            }}
            modifiers={{
              past: (date) => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return date < today
              },
            }}
            modifiersStyles={{
              past: {
                color: "#dc2626",
                backgroundColor: "#fef2f2",
              },
            }}
            initialFocus
          />
          <div className="p-3 border-t">
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-red-50 border border-red-200 rounded"></span>
              Past dates (unavailable)
            </div>
            <Button onClick={() => setIsOpen(false)} className="w-full" size="sm">
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
