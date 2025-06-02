"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import Link from "next/link"
import { Menu, X, LucideUser, Calendar, Building, Home } from "lucide-react"

interface UserType {
  id: string
  name: string | null
  email: string
  role: string
}

interface MobileAdminMenuProps {
  user: UserType
}

export function MobileAdminMenu({ user }: MobileAdminMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Menu Button */}
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="lg:hidden">
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />

          {/* Menu Panel */}
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Admin Menu</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* User Info */}
              <div className="p-4 border-b bg-purple-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{user.name || "Admin"}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 p-4 space-y-2">
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Home className="h-4 w-4 mr-3" />
                    Dashboard
                  </Button>
                </Link>

                <Link href="/admin/users" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <LucideUser className="h-4 w-4 mr-3" />
                    Manage Users
                  </Button>
                </Link>

                <Link href="/admin/classrooms" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Building className="h-4 w-4 mr-3" />
                    Manage Classrooms
                  </Button>
                </Link>

                <Link href="/timeline" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-3" />
                    View Timeline
                  </Button>
                </Link>
              </div>

              {/* Logout Button */}
              <div className="p-4 border-t">
                <LogoutButton className="w-full" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
