"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Package, Wrench, FileText, BarChart3, Users, Menu, LogOut, User, X, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Materials", href: "/materials", icon: Package },
  { name: "Tools", href: "/tools", icon: Wrench },
  { name: "Requests", href: "/requests", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Users", href: "/users", icon: Users, adminOnly: true },
  ...(process.env.NODE_ENV === "development" ? [{ name: "Debug", href: "/debug", icon: Bug }] : []),
]

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const filteredNavigation = navigation.filter((item) => !item.adminOnly || user?.role === "ADMIN")

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-4 border-b">
        <h1 className="text-lg sm:text-xl font-bold truncate">Material Manager</h1>
        {mobile && (
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      <nav className="flex flex-1 flex-col overflow-y-auto">
        <ul role="list" className="flex flex-1 flex-col gap-y-2 p-4">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => mobile && setSidebarOpen(false)}
                  className={`group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold transition-colors ${
                    isActive ? "bg-gray-50 text-indigo-600" : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 shrink-0 ${
                      isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-indigo-600"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
                  {item.name === "Debug" && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      DEV
                    </Badge>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 sm:w-80">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white">
            <Sidebar mobile />
          </div>
        </SheetContent>
      </Sheet>

      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-gray-900 truncate lg:hidden">Material Manager</h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1">
          <div className="py-4 sm:py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
