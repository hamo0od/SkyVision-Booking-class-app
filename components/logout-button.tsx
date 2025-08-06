"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ArrowRightFromLine } from 'lucide-react'

export function LogoutButton() {
  return (
    <Button variant="outline" onClick={() => signOut({ redirect: false })}>
      <ArrowRightFromLine className="mr-2 h-4 w-4" />
      Logout
    </Button>
  )
}
