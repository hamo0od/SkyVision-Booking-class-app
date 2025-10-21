import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function addAdmin() {
  try {
    const hashedPassword = await bcrypt.hash("password", 12)

    const admin = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        username: "admin",
        password: hashedPassword,
        name: "Admin User",
        role: "ADMIN",
      },
    })

    console.log("Admin user created/verified:", admin.email)
  } catch (error) {
    console.error("Error adding admin user:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addAdmin()
