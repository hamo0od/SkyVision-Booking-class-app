import type { NextRequest } from "next/server"

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  },
  5 * 60 * 1000,
)

export function rateLimit(
  identifier: string,
  limit = 5,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = `rate_limit:${identifier}`

  const current = rateLimitStore.get(key)

  if (!current || now > current.resetTime) {
    // First request or window expired
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { success: true, remaining: limit - 1, resetTime }
  }

  if (current.count >= limit) {
    // Rate limit exceeded
    return { success: false, remaining: 0, resetTime: current.resetTime }
  }

  // Increment count
  current.count++
  rateLimitStore.set(key, current)

  return { success: true, remaining: limit - current.count, resetTime: current.resetTime }
}

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return request.ip || "unknown"
}

export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return ""

  return input
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers like onclick=
    .replace(/script/gi, "") // Remove script tags
    .trim()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

export function validatePassword(password: string): boolean {
  // At least 6 characters
  return password.length >= 6
}

export function validateName(name: string): boolean {
  // 1-50 characters, letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\s\-']{1,50}$/
  return nameRegex.test(name)
}
