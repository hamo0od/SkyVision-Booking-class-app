// Standalone Prisma seed script (ESM)
// Usage:
//  1) Ensure DATABASE_URL is set to your Postgres connection string
//  2) Ensure Prisma Client is generated: npx prisma generate
//  3) Run: node scripts/seed.js
//
// Optional environment overrides:
//  - ADMIN_EMAIL (default: admin@example.com)
//  - USER_EMAIL  (default: user@example.com)
//  - SEED_PASSWORD (default: password)
//
// Note: If your project does not have "type": "module" in package.json,
// you can rename this file to "seed.mjs" and run: node scripts/seed.mjs

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com"
const USER_EMAIL = process.env.USER_EMAIL ?? "user@example.com"
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "password"

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "ERROR: DATABASE_URL is not set. Please export a Postgres connection string and try again.\n" +
        "Example:\n" +
        '  export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"\n',
    )
    process.exit(1)
  }

  console.log("Seeding database...")

  // Create classrooms
  await prisma.classroom.upsert({
    where: { name: "Room A" },
    update: {},
    create: {
      name: "Room A",
      capacity: 30,
      description: "Main lecture hall with projector and whiteboard",
    },
  })

  await prisma.classroom.upsert({
    where: { name: "Room B" },
    update: {},
    create: {
      name: "Room B",
      capacity: 20,
      description: "Smaller classroom perfect for seminars",
    },
  })

  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 12)

  // Admin user
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      username: "admin",
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  })

  // Regular user
  await prisma.user.upsert({
    where: { email: USER_EMAIL },
    update: {},
    create: {
      email: USER_EMAIL,
      username: "user",
      password: hashedPassword,
      name: "Regular User",
      role: "USER",
    },
  })

  console.log("Database seeded successfully!")
  console.log("Demo accounts:")
  console.log(`- Admin: ${ADMIN_EMAIL} / ${SEED_PASSWORD}`)
  console.log(`- User:  ${USER_EMAIL} / ${SEED_PASSWORD}`)
  console.log("Classrooms: Room A (30 capacity), Room B (20 capacity)")
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
