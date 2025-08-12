const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function resetAndSeed() {
  try {
    console.log("🗑️  Deleting all bookings and users...")

    // Delete all bookings first (foreign key constraint)
    await prisma.booking.deleteMany({})
    console.log("✅ Deleted all bookings")

    // Delete all users
    await prisma.user.deleteMany({})
    console.log("✅ Deleted all users")

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
        tokenVersion: 0,
      },
    })
    console.log("✅ Created admin user")

    // Create regular user
    const userPassword = await bcrypt.hash("password", 12)
    const user = await prisma.user.create({
      data: {
        email: "user@example.com",
        username: "user",
        name: "Regular User",
        password: userPassword,
        role: "USER",
        tokenVersion: 0,
      },
    })
    console.log("✅ Created regular user")

    console.log("\n🎉 Database reset complete!")
    console.log("\n📝 Login credentials:")
    console.log("Admin: admin@example.com / password")
    console.log("User:  user@example.com / password")
  } catch (error) {
    console.error("❌ Error resetting database:", error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAndSeed()
