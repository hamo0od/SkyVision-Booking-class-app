import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting database seed...")

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

  console.log("Classrooms created")

  // Hash passwords
  const hashedPassword = await bcrypt.hash("password", 12)
  console.log("Password hashed successfully")

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      password: hashedPassword, // Update password in case it was wrong
    },
    create: {
      email: "admin@example.com",
      username: "admin",
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  })

  // Create regular user
  const regularUser = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {
      password: hashedPassword, // Update password in case it was wrong
    },
    create: {
      email: "user@example.com",
      username: "user",
      password: hashedPassword,
      name: "Regular User",
      role: "USER",
    },
  })

  console.log("Users created/updated:")
  console.log("Admin:", adminUser.username, adminUser.email)
  console.log("User:", regularUser.username, regularUser.email)

  console.log("Database seeded successfully!")
  console.log("Demo accounts:")
  console.log("Admin: admin / password")
  console.log("User: user / password")
  console.log("Classrooms created: Room A (30 capacity), Room B (20 capacity)")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
