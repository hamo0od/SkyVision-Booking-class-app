import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/admin")

  if (!isProtectedRoute) return NextResponse.next()

  const token = await getToken({ req: request })
  if (token) return NextResponse.next()

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim().toLowerCase()
  const host = forwardedHost ?? request.headers.get("host")?.toLowerCase()
  const isPublicHost = host === "classroom.skyvisionairline.net" || host === "classroom.skyvisionairline.net:443"
  const origin = isPublicHost ? "https://classroom.skyvisionairline.net" : request.nextUrl.origin

  return NextResponse.redirect(new URL("/auth/signin", origin))
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
}
