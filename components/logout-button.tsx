'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({
      callbackUrl: `${window.location.origin}/auth/signin`
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  )
}
