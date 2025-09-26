"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X } from "lucide-react"
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

      {/* Selected Dates Display - Enhanced */}
      {selectedDates.length > 0 && (
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">📋 Your Selected Dates ({selectedDates.length})</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSelectedDatesChange([])}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear All
            </Button>
          </div>

          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {selectedDates.map((dateStr, index) => (
                <div
                  key={dateStr}
                  className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-blue-300 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-blue-900">{format(new Date(dateStr), "MMM d")}</span>
                    <span className="text-xs text-blue-600">{format(new Date(dateStr), "yyyy")}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newDates = selectedDates.filter((date) => date !== dateStr)
                      onSelectedDatesChange(newDates)
                    }}
                    className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-1 transition-colors"
                    title={`Remove ${format(new Date(dateStr), "MMM d, yyyy")}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded">
              💡 <strong>Tip:</strong> Click the ✕ button to remove individual dates, or use "Clear All" to start fresh.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
