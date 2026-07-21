import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { rateLimit, sanitizeInput } from "@/lib/security"

const DUMMY_PASSWORD_HASH = "$2a$12$NCo2KRcWT4FtZGfW76nRUuav0hJDcfplQNEgFLZ6F0SfI4tFlMhyG"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) return null

        // Rate limiting
        const clientIP = req?.headers?.["x-forwarded-for"] || req?.headers?.["x-real-ip"] || "unknown"
        const rateLimitResult = rateLimit(`auth:${clientIP}`, 5, 15 * 60 * 1000)

        if (!rateLimitResult.success) return null

        // Sanitize input
        const username = sanitizeInput(credentials.username)
        const password = credentials.password

        try {
          // Find user by username or email
          const user = await prisma.user.findFirst({
            where: {
              OR: [{ username: username }, { email: username }],
            },
          })

          // Always perform a password comparison to reduce account-enumeration timing differences.
          const isValidPassword = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH)
          if (!user || !isValidPassword) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            username: user.username,
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
        token.id = user.id
        token.username = user.username
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
            return null as never // NextAuth treats this as an invalidated session at runtime.
          }
        } catch (error) {
          console.error("Error checking token version:", error)
          return null as never
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
  debug: process.env.NODE_ENV === "development",
}
