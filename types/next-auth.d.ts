declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      username: string
      role: string
      tokenVersion: number
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    username: string
    role: string
    tokenVersion: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    username: string
    tokenVersion: number
  }
}
