import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { CreateUserForm } from "@/components/create-user-form"
import { UsersList } from "@/components/users-list"
import { LogoutButton } from "@/components/logout-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, ArrowLeft } from "lucide-react"

export default async function UsersManagement() {
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

  const allUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { bookings: true },
      },
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <Users className="h-8 w-8 text-indigo-600" />
                User Management
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                {user.name || user.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New User</h2>
              <CreateUserForm />
            </div>
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                All Users
                <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {allUsers.length}
                </span>
              </h2>
              <UsersList users={allUsers} currentUserId={user.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
