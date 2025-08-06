import { PrismaClient } from "@prisma/client"

// Add prisma to the NodeJS global type
interface CustomNodeJsGlobal extends NodeJS.Global {
  prisma: PrismaClient
}

// Prevent multiple instances of Prisma Client in development
declare const global: CustomNodeJsGlobal

// Fallback database URL if environment variable is missing
const databaseUrl =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:password@localhost:5432/material_management?schema=public"

// Initialize Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
}

export const prisma = global.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== "production") global.prisma = prisma
