import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default withAuth(
  function middleware(request: NextRequest) {
    // Security headers
    const response = NextResponse.next()

    // XSS Protection
    response.headers.set("X-XSS-Protection", "1; mode=block")

    // Prevent clickjacking
    response.headers.set("X-Frame-Options", "DENY")

    // Content type sniffing protection
    response.headers.set("X-Content-Type-Options", "nosniff")

    // Referrer policy
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

    // Content Security Policy
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
    )

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes
        if (pathname === "/" || pathname === "/auth/signin") {
          return true
        }

        // Protected routes require authentication
        if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
          return !!token
        }

        return true
      },
    },
  },
)

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
}
