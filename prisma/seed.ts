import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create classrooms
  const classroom1 = await prisma.classroom.upsert({
    where: { name: "Room A" },
    update: {},
    create: {
      name: "Room A",
      capacity: 30,
      description: "Main lecture hall with projector and whiteboard",
    },
  })

  const classroom2 = await prisma.classroom.upsert({
    where: { name: "Room B" },
    update: {},
    create: {
      name: "Room B",
      capacity: 20,
      description: "Smaller classroom perfect for seminars",
    },
  })

  // Create admin user
  const hashedPassword = await bcrypt.hash("password", 12)

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      role: "ADMIN",
    },
  })

  // Create regular user
  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "Regular User",
      role: "USER",
    },
  })

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
