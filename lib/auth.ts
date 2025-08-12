import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./db"
import bcrypt from "bcryptjs"
import { rateLimit } from "./security"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        console.log("🔐 Auth attempt:", { username: credentials?.username })

        if (!credentials?.username || !credentials?.password) {
          console.log("❌ Missing credentials")
          return null
        }

        // Rate limiting
        const ip = (req?.headers?.["x-forwarded-for"] as string) || "unknown"
        const rateLimitResult = rateLimit(`auth:${ip}`, 5, 15 * 60 * 1000)

        if (!rateLimitResult.success) {
          console.log("❌ Rate limit exceeded for IP:", ip)
          return null
        }

        try {
          // Find user by username or email
          const user = await prisma.user.findFirst({
            where: {
              OR: [{ username: credentials.username }, { email: credentials.username }],
            },
          })

          console.log("👤 User found:", user ? "Yes" : "No")

          if (!user) {
            return null
          }

          // Check password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          console.log("🔑 Password valid:", isValidPassword)

          if (!isValidPassword) {
            return null
          }

          console.log("✅ Login successful for:", user.username)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            role: user.role,
            tokenVersion: user.tokenVersion,
          }
        } catch (error) {
          console.error("❌ Auth error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.tokenVersion = user.tokenVersion
      }

      // Check if token version is still valid
      if (token.id && token.tokenVersion !== undefined) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { tokenVersion: true },
          })

          if (!dbUser || dbUser.tokenVersion !== token.tokenVersion) {
            console.log("🔄 Token version mismatch, invalidating session")
            return null
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
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as string
        session.user.tokenVersion = token.tokenVersion as number
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  debug: true,
}
