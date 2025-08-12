import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"
import { OverlayCleaner } from "@/components/overlay-cleaner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Classroom Booking System",
  description: "Book and manage classroom reservations",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
          <OverlayCleaner />
        </Providers>
      </body>
    </html>
  )
}
