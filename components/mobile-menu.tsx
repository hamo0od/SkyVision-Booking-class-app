"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { Menu, User, Building } from 'lucide-react'

interface MobileMenuProps {
  user: {
    name: string
    email: string
    role: string
  }
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xs">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            {user.name}
          </SheetTitle>
          <SheetDescription>
            {user.email}
            <br />
            {user.role === "ADMIN" ? "Administrator" : "User"}
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <Button variant="ghost" className="justify-start">
            <Building className="mr-2 h-4 w-4" />
            Book a Classroom
          </Button>
          <LogoutButton />
        </div>
      </SheetContent>
    </Sheet>
  )
}
