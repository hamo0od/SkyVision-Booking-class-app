'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, User, Settings, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

interface MobileMenuProps {
  user: {
    name: string
    email: string
    role: string
  }
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    const currentDomain = window.location.origin
    signOut({ 
      callbackUrl: `${currentDomain}/auth/signin`,
      redirect: true 
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <div className="flex flex-col h-full">
          {/* User Info */}
          <div className="border-b pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-xs text-blue-600 font-medium">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 space-y-2">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start" onClick={() => setIsOpen(false)}>
                Dashboard
              </Button>
            </Link>
            
            {user.role === 'ADMIN' && (
              <>
                <Link href="/admin">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setIsOpen(false)}>
                    Admin Panel
                  </Button>
                </Link>
                <Link href="/admin/users">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setIsOpen(false)}>
                    Manage Users
                  </Button>
                </Link>
                <Link href="/admin/classrooms">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setIsOpen(false)}>
                    Manage Classrooms
                  </Button>
                </Link>
                <Link href="/admin/profile">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setIsOpen(false)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Profile Settings
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Logout */}
          <div className="border-t pt-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
