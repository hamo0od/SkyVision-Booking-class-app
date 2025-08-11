import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./db"
import bcrypt from "bcryptjs"

/**
 * We embed a per-user tokenVersion in the JWT.
 * - On password change, we increment tokenVersion in the database.
 * - On every request, we compare JWT tokenVersion with the current DB value.
 *   If mismatched, we flag the token as invalid and return a null session, effectively logging the user out.
 */

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

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
            tokenVersion: true, // may be null on older DBs, treat as 0
          },
        })

        if (!user || !user.password) return null

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          username: user.username ?? undefined,
          role: user.role,
          tokenVersion: user.tokenVersion ?? 0,
        } as any
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 60 * 60,
  },
  jwt: { maxAge: 8 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in attach fields
      if (user) {
        token.role = (user as any).role
        token.username = (user as any).username
        token.tokenVersion = (user as any).tokenVersion ?? 0
        token.sessionInvalid = false
        return token
      }

      // On subsequent requests, compare tokenVersion with DB to see if sessions were invalidated
      if (token?.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { tokenVersion: true },
          })
          const current = dbUser?.tokenVersion ?? 0
          const fromToken = (token as any).tokenVersion ?? 0
          if (current !== fromToken) {
            ;(token as any).sessionInvalid = true
          }
        } catch {
          // If anything goes wrong, keep user safe and mark invalid
          ;(token as any).sessionInvalid = true
        }
      }
      return token
    },
    async session({ session, token }) {
      if ((token as any).sessionInvalid) {
        // Returning null makes getServerSession return null and useSession report unauthenticated
        return null
      }
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
  pages: { signIn: "/auth/signin" },
}
