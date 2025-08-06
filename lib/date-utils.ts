"use client"

import { useState, useEffect } from "react"

// Hook to handle client-side date formatting to avoid hydration issues
export function useClientDate(date: string | Date) {
  const [formattedDate, setFormattedDate] = useState<string>("")

  useEffect(() => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    setFormattedDate(dateObj.toLocaleDateString())
  }, [date])

  return formattedDate
}

export function useClientDateTime(date: string | Date) {
  const [formattedDateTime, setFormattedDateTime] = useState<string>("")

  useEffect(() => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    setFormattedDateTime(dateObj.toLocaleString())
  }, [date])

  return formattedDateTime
}

// Server-safe date formatting (returns ISO string)
export function formatDateSafe(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toISOString().split("T")[0]
}

export function formatDateTimeSafe(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toISOString()
}
