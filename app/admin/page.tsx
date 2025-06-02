import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { AdminBookingList } from "@/components/admin-booking-list"
import { LogoutButton } from "@/components/logout-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminPanel() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/dashboard")
  }

  // Get the actual user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const pendingBookings = await prisma.booking.findMany({
    where: { status: "PENDING" },
    include: {
      user: true,
      classroom: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const allBookings = await prisma.booking.findMany({
    include: {
      user: true,
      classroom: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                {user.name || user.email}
              </span>
              <Link href="/dashboard">
                <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                  Back to Dashboard
                </Button>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                Pending Requests
                <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {pendingBookings.length}
                </span>
              </h2>
              <AdminBookingList bookings={pendingBookings} showActions={true} />
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">All Bookings</h2>
              <AdminBookingList bookings={allBookings} showActions={false} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
