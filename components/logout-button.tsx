'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const handleLogout = () => {
    const currentDomain = window.location.origin
    signOut({ 
      callbackUrl: `${currentDomain}/auth/signin`,
      redirect: true 
    })
  }

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  )
}
