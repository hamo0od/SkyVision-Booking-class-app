import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { BookingForm } from "@/components/booking-form"
import { BookingList } from "@/components/booking-list"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import Link from "next/link"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const classrooms = await prisma.classroom.findMany()
  const userBookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { classroom: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Classroom Booking System</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {session.user.name || session.user.email}</span>
              {session.user.role === "ADMIN" && (
                <Link href="/admin">
                  <Button variant="outline">Admin Panel</Button>
                </Link>
              )}
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Book a Classroom</h2>
              <BookingForm classrooms={classrooms} />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Your Bookings</h2>
              <BookingList bookings={userBookings} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
