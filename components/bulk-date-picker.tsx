"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"

interface BulkDatePickerProps {
  selectedDates: Date[]
  onDatesChange: (dates: Date[]) => void
}

export function BulkDatePicker({ selectedDates, onDatesChange }: BulkDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    const dateExists = selectedDates.some((selectedDate) => selectedDate.toDateString() === date.toDateString())

    if (dateExists) {
      // Remove date if already selected
      onDatesChange(selectedDates.filter((selectedDate) => selectedDate.toDateString() !== date.toDateString()))
    } else {
      // Add date if not selected
      onDatesChange([...selectedDates, date].sort((a, b) => a.getTime() - b.getTime()))
    }
  }

  const removeDate = (dateToRemove: Date) => {
    onDatesChange(selectedDates.filter((date) => date.toDateString() !== dateToRemove.toDateString()))
  }

  const clearAllDates = () => {
    onDatesChange([])
  }

  return (
    <div className="space-y-4">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDates.length > 0 ? `${selectedDates.length} dates selected` : "Select dates"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="multiple"
            selected={selectedDates}
            onSelect={(dates) => {
              if (dates) {
                onDatesChange(Array.from(dates).sort((a, b) => a.getTime() - b.getTime()))
              }
            }}
            disabled={(date) => {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              return date < today
            }}
            initialFocus
          />
          <div className="p-3 border-t">
            <Button onClick={() => setIsOpen(false)} className="w-full" size="sm">
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {selectedDates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Selected Dates ({selectedDates.length}):</span>
            <Button variant="outline" size="sm" onClick={clearAllDates} className="text-xs bg-transparent">
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {selectedDates.map((date, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm border border-blue-200"
              >
                <span>{format(date, "MMM d, yyyy")}</span>
                <button
                  type="button"
                  onClick={() => removeDate(date)}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
