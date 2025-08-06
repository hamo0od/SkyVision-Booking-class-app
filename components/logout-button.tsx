'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      // Clear any stored authentication data
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      
      // Call logout API if needed
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      // Redirect to login page
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if API call fails
      router.push('/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
    >
      <LogOut className="h-4 w-4" />
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </Button>
  )
}
