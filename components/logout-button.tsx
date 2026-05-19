"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import type { ComponentProps } from "react"

type LogoutButtonProps = ComponentProps<typeof Button>

export function LogoutButton(props: LogoutButtonProps) {
  const handleSignOut = () => {
    // Use a relative URL so NextAuth resolves it to the current origin correctly
    // This avoids localhost vs LAN IP mismatches.
    signOut({
      callbackUrl: "/auth/signin",
      redirect: true,
    })
  }

  return (
    <Button variant="outline" onClick={handleSignOut} aria-label="Sign out" {...props}>
      Sign Out
    </Button>
  )
}
