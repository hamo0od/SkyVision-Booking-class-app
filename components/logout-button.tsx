"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const handleSignOut = () => {
    // Get the current domain for production
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : process.env.NEXTAUTH_URL || "http://localhost:3000"

    signOut({
      callbackUrl: `${baseUrl}/auth/signin`,
      redirect: true,
    })
  }

  return (
    <Button variant="outline" onClick={handleSignOut}>
      Sign Out
    </Button>
  )
}
