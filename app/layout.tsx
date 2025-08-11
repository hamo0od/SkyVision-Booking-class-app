import type React from "react"
import "./globals.css"
import OverlayCleaner from "@/components/overlay-cleaner"
import { Providers } from "./providers"

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

export const metadata = {
  generator: "v0.dev",
}
