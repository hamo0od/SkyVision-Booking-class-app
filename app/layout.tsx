import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "./providers"
import { OverlayCleaner } from "@/components/overlay-cleaner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Classroom Booking App",
  description: "Book classrooms easily",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <OverlayCleaner />
      </body>
    </html>
  )
}
