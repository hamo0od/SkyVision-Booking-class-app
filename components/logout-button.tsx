"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const handleSignOut = () => {
    // Use a relative URL so NextAuth resolves it to the current origin correctly
    // This avoids localhost vs LAN IP mismatches.
    signOut({
      callbackUrl: "/auth/signin",
      redirect: true,
    })
  }

  return (
    <Button variant="outline" onClick={handleSignOut} aria-label="Sign out">
      Sign Out
    </Button>
  )
}
