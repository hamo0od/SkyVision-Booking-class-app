import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function resetAndSeed() {
  try {
    console.log("🗑️  Deleting all bookings...")
    await prisma.booking.deleteMany({})

    console.log("🗑️  Deleting all users...")
    await prisma.user.deleteMany({})

    console.log("🌱 Creating fresh users...")

    // Create admin user
    const adminPassword = await bcrypt.hash("password", 12)
    const admin = await prisma.user.create({
      data: {
        email: "admin@example.com",
        username: "admin",
        name: "Admin User",
        password: adminPassword,
        role: "ADMIN",
      },
    })
    console.log("✅ Created admin user:", admin.username)

    // Create regular user
    const userPassword = await bcrypt.hash("password", 12)
    const user = await prisma.user.create({
      data: {
        email: "user@example.com",
        username: "user",
        name: "Regular User",
        password: userPassword,
        role: "USER",
      },
    })
    console.log("✅ Created regular user:", user.username)

    console.log("🎉 Reset and seed completed successfully!")
    console.log("Login credentials:")
    console.log("Admin: admin@example.com / password")
    console.log("User: user@example.com / password")
  } catch (error) {
    console.error("❌ Error during reset and seed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

resetAndSeed()
