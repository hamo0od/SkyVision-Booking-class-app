import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { AdminBookingList } from "@/components/admin-booking-list"
import { LogoutButton } from "@/components/logout-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Building, ArrowLeft, Settings } from "lucide-react"
import { MobileAdminMenu } from "@/components/mobile-admin-menu"

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
      <header className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/dashboard" className="lg:hidden">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-lg sm:text-xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                <span className="hidden sm:inline">Admin Panel</span>
                <span className="sm:hidden">Admin</span>
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <span className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                {user.name || user.email}
              </span>
              <Link href="/dashboard">
                <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/classrooms">
                <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                  <Building className="h-4 w-4 mr-2" />
                  Manage Classrooms
                </Button>
              </Link>
              <Link href="/admin/profile">
                <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                  <Settings className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <LogoutButton />
            </div>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <MobileAdminMenu user={user} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 lg:space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 lg:mb-6 text-gray-800 flex items-center gap-2">
              Pending Requests
              <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {pendingBookings.length}
              </span>
            </h2>
            <AdminBookingList bookings={pendingBookings} showActions={true} />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 lg:mb-6 text-gray-800">All Bookings</h2>
            <AdminBookingList bookings={allBookings} showActions={false} />
          </div>
        </div>
      </main>
    </div>
  )
}
