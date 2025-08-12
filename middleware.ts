import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { rateLimit, getClientIP } from "@/lib/security"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apply rate limiting to auth endpoints
  if (pathname.startsWith("/api/auth/callback/credentials")) {
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(`auth:${clientIP}`, 5, 15 * 60 * 1000) // 5 attempts per 15 minutes

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          },
        },
      )
    }
  }

  // Apply general rate limiting to API routes
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(`api:${clientIP}`, 100, 60 * 1000) // 100 requests per minute

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          },
        },
      )
    }
  }

  // Protected routes
  const protectedPaths = ["/dashboard", "/admin", "/timeline"]
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

  if (isProtectedPath) {
    const token = await getToken({ req: request })

    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/signin"
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }

    // Admin-only routes
    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  // Security headers
  const response = NextResponse.next()

  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  )

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}
