import type { NextRequest } from "next/server"

// XSS Protection utilities
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return ""

  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/&/g, "&amp;")
    .trim()
}

// Sanitize form data
export function sanitizeFormData(formData: FormData): Record<string, string> {
  const sanitized: Record<string, string> = {}

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value)
    }
  }

  return sanitized
}

// CSRF Protection
export function validateCSRF(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  const host = request.headers.get("host")

  if (!origin || !host) {
    return false
  }

  return new URL(origin).host === host
}

// Rate limiting implementation
class RateLimiter {
  private requests = new Map<string, number[]>()
  private windowMs: number
  private maxRequests: number

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const windowStart = now - this.windowMs

    const userRequests = this.requests.get(identifier) || []
    const validRequests = userRequests.filter((time) => time > windowStart)

    if (validRequests.length >= this.maxRequests) {
      return false
    }

    validRequests.push(now)
    this.requests.set(identifier, validRequests)

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup()
    }

    return true
  }

  private cleanup() {
    const now = Date.now()
    const windowStart = now - this.windowMs

    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter((time) => time > windowStart)
      if (validRequests.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validRequests)
      }
    }
  }
}

// Rate limiters for different endpoints
export const authRateLimiter = new RateLimiter(15 * 60 * 1000, 5) // 5 attempts per 15 minutes
export const generalRateLimiter = new RateLimiter(60 * 1000, 100) // 100 requests per minute

// Get client IP
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
