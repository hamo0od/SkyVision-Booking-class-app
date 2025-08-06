'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, User, Settings, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface MobileMenuProps {
  user: User
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await signOut({
      callbackUrl: `${window.location.origin}/auth/signin`
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px]">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-blue-600">{user.role}</p>
            </div>
          </div>

          <div className="flex-1 py-4">
            <nav className="space-y-2">
              {user.role === 'ADMIN' && (
                <a
                  href="/admin"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Admin Panel
                </a>
              )}
              
              {user.role === 'ADMIN' && (
                <a
                  href="/admin/profile"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </a>
              )}
            </nav>
          </div>

          <div className="border-t pt-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
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
