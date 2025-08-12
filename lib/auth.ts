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
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            role: true,
            password: true,
            tokenVersion: true,
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
          tokenVersion: user.tokenVersion || 0,
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
        token.tokenVersion = (user as any).tokenVersion || 0
      }

      // Check if the user's session should be invalidated
      if (token?.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { tokenVersion: true },
          })

          const currentTokenVersion = dbUser?.tokenVersion || 0
          const jwtTokenVersion = (token as any).tokenVersion || 0

          // If token versions don't match, invalidate the session
          if (currentTokenVersion !== jwtTokenVersion) {
            return null
          }
        } catch (error) {
          // If there's an error checking the token version, invalidate the session
          return null
        }
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
  pages: {
    signIn: "/auth/signin",
  },
}
