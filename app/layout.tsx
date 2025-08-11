import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import OverlayCleaner from "@/components/overlay-cleaner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Classroom Booking System",
  description: "Book classrooms with admin approval",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* Suppress hydration warnings on the body. Some extensions add classes (e.g. vsc-*) before hydration. */}
      <body className={inter.className} suppressHydrationWarning>
        {/* Runs after hydration; safely removes stubborn bottom-left overlay widgets */}
        <OverlayCleaner />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
