"use client"

import type React from "react"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { HydrationBoundary } from "@/components/hydration-boundary"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <HydrationBoundary>{children}</HydrationBoundary>
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  )
}
