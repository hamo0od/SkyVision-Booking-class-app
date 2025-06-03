import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { BookingForm } from "@/components/booking-form"
import { BookingList } from "@/components/booking-list"
import { HorizontalBookingTimeline } from "@/components/horizontal-booking-timeline"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import Link from "next/link"
import { MobileMenu } from "@/components/mobile-menu"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/auth/signin")
  }

  // Get the actual user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    redirect("/auth/signin")
  }

  const classrooms = await prisma.classroom.findMany()
  const userBookings = await prisma.booking.findMany({
    where: { userId: user.id }, // Use the actual user ID
    include: { classroom: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-6">
            {/* Logo/Title - Responsive */}
            <h1 className="text-lg sm:text-xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              <span className="hidden sm:inline">Classroom Booking System</span>
              <span className="sm:hidden">Booking</span>
            </h1>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <span className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                Welcome, {user.name || user.email}
              </span>
              {user.role === "ADMIN" && (
                <Link href="/admin">
                  <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Link href="/timeline">
                <Button variant="outline" className="border-green-200 text-green-600 hover:bg-green-50">
                  Full Timeline
                </Button>
              </Link>
              <LogoutButton />
            </div>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <MobileMenu user={user} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 lg:space-y-8">
          {/* Booking Form and User Bookings - Now at the top */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            <div className="w-full">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 lg:mb-6 text-gray-800">Book a Classroom</h2>
              <BookingForm classrooms={classrooms} />
            </div>
            <div className="w-full">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 lg:mb-6 text-gray-800">Your Bookings</h2>
              <BookingList bookings={userBookings} />
            </div>
          </div>

          {/* Horizontal Timeline Section - Now at the bottom */}
          <div className="w-full">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 lg:mb-6 text-gray-800">Today's Schedule</h2>
            <HorizontalBookingTimeline />
          </div>
        </div>
      </main>
    </div>
  )
}
