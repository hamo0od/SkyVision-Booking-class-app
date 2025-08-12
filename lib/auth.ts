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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.password) {
          console.log("No password provided")
          return null
        }

        // Try to find user by username or email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: credentials.username || credentials.email },
              { email: credentials.email || credentials.username },
            ],
          },
        })

        console.log("Found user:", user ? { id: user.id, email: user.email, username: user.username } : "None")

        if (!user) {
          console.log("User not found")
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        console.log("Password valid:", isPasswordValid)

        if (!isPasswordValid) {
          console.log("Invalid password")
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
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
        token.tokenVersion = user.tokenVersion
      }

      // Check if tokenVersion has changed (user password was changed)
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { tokenVersion: true },
        })

        if (dbUser && token.tokenVersion !== dbUser.tokenVersion) {
          // Token is invalid, force logout
          return {}
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
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
}
