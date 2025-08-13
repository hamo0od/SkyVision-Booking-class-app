import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { rateLimit, sanitizeInput } from "@/lib/security"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        // Rate limiting
        const clientIP = req?.headers?.["x-forwarded-for"] || req?.headers?.["x-real-ip"] || "unknown"
        const rateLimitResult = rateLimit(`auth:${clientIP}`, 5, 15 * 60 * 1000)

        if (!rateLimitResult.success) {
          console.log("Rate limit exceeded for IP:", clientIP)
          return null
        }

        // Sanitize input
        const username = sanitizeInput(credentials.username)
        const password = credentials.password

        console.log("Attempting login for:", username)

        try {
          // Find user by username or email
          const user = await prisma.user.findFirst({
            where: {
              OR: [{ username: username }, { email: username }],
            },
          })

          if (!user) {
            console.log("User not found:", username)
            return null
          }

          console.log("User found:", user.email, "Role:", user.role)

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password)

          if (!isValidPassword) {
            console.log("Invalid password for user:", username)
            return null
          }

          console.log("Password valid, login successful")

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tokenVersion: user.tokenVersion,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.tokenVersion = user.tokenVersion
      }

      // Check if tokenVersion is still valid
      if (token.email && token.tokenVersion !== undefined) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { tokenVersion: true },
          })

          if (!dbUser || dbUser.tokenVersion !== token.tokenVersion) {
            console.log("Token version mismatch, invalidating session")
            return null // This will invalidate the session
          }
        } catch (error) {
          console.error("Error checking token version:", error)
          return null
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string
        session.user.tokenVersion = token.tokenVersion as number
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  debug: process.env.NODE_ENV === "development",
}
