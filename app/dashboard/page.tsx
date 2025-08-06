import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { BookingForm } from "@/components/booking-form"
import { BookingList } from "@/components/booking-list"
import { BookingTimeline } from "@/components/booking-timeline"
import { LogoutButton } from "@/components/logout-button"
import { MobileMenu } from "@/components/mobile-menu"
import { Calendar, Clock, Users, Building } from 'lucide-react'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/auth/signin")
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    redirect("/auth/signin")
  }

  // Get user's bookings
  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: {
      classroom: true,
    },
    orderBy: { startTime: "desc" },
  })

  // Get all classrooms
  const classrooms = await prisma.classroom.findMany({
    orderBy: { name: "asc" },
  })

  // Get today's bookings for timeline
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  const todayBookings = await prisma.booking.findMany({
    where: {
      startTime: {
        gte: startOfDay,
        lt: endOfDay,
      },
      status: {
        in: ["PENDING", "APPROVED"],
      },
    },
    include: {
      classroom: true,
      user: true,
    },
    orderBy: { startTime: "asc" },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Classroom Booking</h1>
                <p className="text-sm text-gray-500">Welcome, {user.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {user.role === "ADMIN" && (
                <a
                  href="/admin"
                  className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Admin Panel
                </a>
              )}
              <div className="hidden sm:block">
                <LogoutButton />
              </div>
              <div className="sm:hidden">
                <MobileMenu user={user} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Booking Form */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Book a Classroom</h2>
              </div>
              <BookingForm classrooms={classrooms} />
            </div>
          </div>

          {/* Right Column - My Bookings */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {bookings.length}
                </span>
              </div>
              <BookingList bookings={bookings} />
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="mt-12">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Today's Schedule</h2>
              <span className="text-sm text-gray-500">
                {today.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <BookingTimeline bookings={todayBookings} classrooms={classrooms} />
          </div>
        </div>
      </main>
    </div>
  )
}
