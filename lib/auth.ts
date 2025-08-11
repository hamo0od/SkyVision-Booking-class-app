import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./db"

/**
 * Credentials login that accepts username or email.
 * This version does not require any extra DB fields and should work with your current Prisma schema and seed.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Username or Email", type: "text" },
        username: { label: "Username", type: "text" },
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier =
          credentials?.identifier?.toString().trim() ||
          credentials?.username?.toString().trim() ||
          credentials?.email?.toString().trim()

        const password = credentials?.password?.toString() || ""

        if (!identifier || !password) {
          return null
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ username: identifier }, { email: identifier }],
          },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            role: true,
            password: true,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const ok = await bcrypt.compare(password, user.password)
        if (!ok) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          username: user.username,
          role: user.role,
        } as any
      },
    }),
  ],
  session: {
    strategy: "jwt",
    // 8 hours
    maxAge: 8 * 60 * 60,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: 8 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.username = (user as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        ;(session.user as any).id = token.sub
        ;(session.user as any).role = (token as any).role
        ;(session.user as any).username = (token as any).username
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      return baseUrl + "/auth/signin"
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
