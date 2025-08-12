import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Auth attempt with:", credentials?.username)

        if (!credentials?.username || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        try {
          // Find user by username or email
          const user = await prisma.user.findFirst({
            where: {
              OR: [{ username: credentials.username }, { email: credentials.username }],
            },
          })

          console.log("Found user:", user ? { id: user.id, username: user.username, email: user.email } : "none")

          if (!user || !user.password) {
            console.log("User not found or no password")
            return null
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          console.log("Password valid:", isPasswordValid)

          if (!isPasswordValid) {
            console.log("Invalid password")
            return null
          }

          console.log("Auth successful for:", user.username)
          return {
            id: user.id,
            email: user.email,
            username: user.username,
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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.username = user.username
        token.tokenVersion = user.tokenVersion
      }

      // Check if token version is still valid (for password change logout)
      if (token.sub && token.tokenVersion !== undefined) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { tokenVersion: true },
          })

          if (!dbUser || dbUser.tokenVersion !== token.tokenVersion) {
            console.log("Token version mismatch, invalidating session")
            return {}
          }
        } catch (error) {
          console.error("Token validation error:", error)
          return {}
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as string
        session.user.username = token.username as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  debug: true,
}
