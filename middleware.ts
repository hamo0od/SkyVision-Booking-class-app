import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getClientIP, authRateLimiter, generalRateLimiter } from "./lib/security"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add security headers
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  )

  const clientIP = getClientIP(request)
  const pathname = request.nextUrl.pathname

  // Rate limiting for auth endpoints
  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/auth/")) {
    if (!authRateLimiter.isAllowed(clientIP)) {
      return new NextResponse(JSON.stringify({ error: "Too many authentication attempts. Please try again later." }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "900", // 15 minutes
        },
      })
    }
  }

  // General rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    if (!generalRateLimiter.isAllowed(clientIP)) {
      return new NextResponse(JSON.stringify({ error: "Rate limit exceeded. Please slow down." }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      })
    }
  }

  return response
}

export const config = {
  matcher: ["/api/:path*", "/auth/:path*", "/admin/:path*", "/dashboard/:path*"],
}
