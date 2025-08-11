import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Providers } from "./providers"
import { OverlayCleaner } from "@/components/overlay-cleaner"

export const metadata: Metadata = {
  title: "Class Room Booking App",
  description: "Book classrooms, manage users, and view timelines",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <OverlayCleaner />
      </body>
    </html>
  )
}
