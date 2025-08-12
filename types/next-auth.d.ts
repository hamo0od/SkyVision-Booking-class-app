import type { DefaultSession, DefaultUser } from "next-auth"
import type { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      username: string
      tokenVersion: number
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: string
    username: string
    tokenVersion: number
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string
    username: string
    tokenVersion: number
  }
}
