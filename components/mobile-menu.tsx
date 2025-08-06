'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, Calendar, Users, Settings, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from './logout-button'

interface MobileMenuProps {
  user?: {
    name: string
    role: string
  }
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const menuItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: Home
    },
    {
      href: '/bookings',
      label: 'My Bookings',
      icon: Calendar
    },
    ...(user?.role === 'admin' ? [
      {
        href: '/admin/users',
        label: 'Manage Users',
        icon: Users
      },
      {
        href: '/admin/reports',
        label: 'Reports',
        icon: BarChart3
      }
    ] : []),
    {
      href: '/profile',
      label: 'Profile',
      icon: Settings
    }
  ]

  const isActive = (href: string) => pathname === href

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="text-left">
            Classroom Booking
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {user && (
            <div className="pb-4 border-b">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-gray-500 capitalize">{user.role}</p>
            </div>
          )}
          
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          
          <div className="pt-4 border-t">
            <LogoutButton />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
