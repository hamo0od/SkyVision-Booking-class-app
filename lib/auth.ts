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
          tokenVersion: user.tokenVersion,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
    updateAge: 60 * 60, // Update every hour
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role
        token.username = user.username
        token.tokenVersion = user.tokenVersion
      }

      // Check if token is still valid by comparing tokenVersion
      if (token.sub && token.tokenVersion !== undefined) {
        const currentUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { tokenVersion: true },
        })

        // If tokenVersion doesn't match, invalidate the token
        if (!currentUser || currentUser.tokenVersion !== token.tokenVersion) {
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
        session.user.tokenVersion = token.tokenVersion
      }
      return session
    },
    redirect: async ({ url, baseUrl }) => {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
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
