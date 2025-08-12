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
        console.log("Auth attempt with:", { username: credentials?.username })

        if (!credentials?.username || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        // Try to find user by email or username
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: credentials.username }, { username: credentials.username }],
          },
        })

        console.log("Found user:", user ? { id: user.id, username: user.username, email: user.email } : "none")

        if (!user || !user.password) {
          console.log("User not found or no password")
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        console.log("Password valid:", isPasswordValid)

        if (!isPasswordValid) {
          console.log("Invalid password")
          return null
        }

        console.log("Auth successful for user:", user.username)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          role: user.role,
          tokenVersion: user.tokenVersion,
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

      // Check if tokenVersion is still valid
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { tokenVersion: true },
        })

        // If tokenVersion doesn't match, invalidate the token
        if (!dbUser || dbUser.tokenVersion !== token.tokenVersion) {
          console.log("Token version mismatch, invalidating session")
          return null
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.username = token.username as string
        session.user.tokenVersion = token.tokenVersion as number
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
  debug: true, // Enable debug logs
}
