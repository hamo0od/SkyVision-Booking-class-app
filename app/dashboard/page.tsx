"use client"

import { useState, useEffect } from "react"
import { prisma } from "@/lib/db"
import { BookingForm } from "@/components/booking-form"
import { BookingList } from "@/components/booking-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"

async function getClassrooms() {
  return await prisma.classroom.findMany({
    orderBy: { name: "asc" },
  })
}

async function getUserBookings(userId: string) {
  return await prisma.booking.findMany({
    where: { userId },
    include: {
      classroom: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export default function DashboardPage() {
  const [classrooms, setClassrooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      // In a real app, you'd get the user ID from the session
      // For now, we'll fetch all data
      const [classroomsData, bookingsData] = await Promise.all([
        fetch("/api/classrooms").then((res) => res.json()),
        fetch("/api/bookings").then((res) => res.json()),
      ])

      setClassrooms(classroomsData)
      setBookings(bookingsData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleBookingSuccess = () => {
    // Refresh the bookings list when a new booking is created
    fetchData()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Manage your classroom bookings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Form */}
        <div>
          <BookingForm classrooms={classrooms} onBookingSuccess={handleBookingSuccess} />
        </div>

        {/* My Bookings */}
        <div>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                My Bookings
              </CardTitle>
              <CardDescription>View and manage your classroom reservations</CardDescription>
            </CardHeader>
            <CardContent>
              <BookingList bookings={bookings} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
