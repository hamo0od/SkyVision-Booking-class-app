import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./db"
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
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Find user in database by username or email
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ username: credentials.username }, { email: credentials.username }],
          },
        })

        if (!user || !user.password) {
          return null
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    // Session expires after 8 hours of inactivity
    maxAge: 8 * 60 * 60, // 8 hours in seconds
    // Update session expiry on every request (sliding session)
    updateAge: 60 * 60, // Update every hour
  },
  jwt: {
    // JWT expires after 8 hours
    maxAge: 8 * 60 * 60, // 8 hours in seconds
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role
        token.username = user.username
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.username = token.username
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  // Handle production vs development URLs
  callbacks: {
    ...{
      jwt: async ({ token, user }) => {
        if (user) {
          token.role = user.role
          token.username = user.username
        }
        return token
      },
      session: async ({ session, token }) => {
        if (token) {
          session.user.id = token.sub
          session.user.role = token.role
          session.user.username = token.username
        }
        return session
      },
    },
    redirect: async ({ url, baseUrl }) => {
      // Handle logout redirects
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      // For production, use the actual domain
      if (url.startsWith(baseUrl)) {
        return url
      }
      return baseUrl + "/auth/signin"
    },
  },
}
