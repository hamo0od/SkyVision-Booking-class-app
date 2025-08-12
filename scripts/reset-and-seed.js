const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🗑️ Clearing existing data...")

  // Delete all bookings first (foreign key constraint)
  await prisma.booking.deleteMany({})
  console.log("✅ Deleted all bookings")

  // Delete all users
  await prisma.user.deleteMany({})
  console.log("✅ Deleted all users")

  // Delete all classrooms
  await prisma.classroom.deleteMany({})
  console.log("✅ Deleted all classrooms")

  console.log("🌱 Seeding fresh data...")

  // Hash passwords
  const adminPassword = await bcrypt.hash("password", 12)
  const userPassword = await bcrypt.hash("password", 12)

  // Create admin user
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

  // Create regular user
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

  // Create sample classrooms
  const classroom1 = await prisma.classroom.create({
    data: {
      name: "Conference Room A",
      capacity: 20,
      description: "Large conference room with projector",
    },
  })

  const classroom2 = await prisma.classroom.create({
    data: {
      name: "Meeting Room B",
      capacity: 10,
      description: "Small meeting room for team discussions",
    },
  })

  console.log("✅ Database seeded successfully!")
  console.log("\n📋 Login Credentials:")
  console.log("👑 Admin: admin@example.com / password")
  console.log("👤 User:  user@example.com / password")
  console.log("\n🏫 Created Classrooms:")
  console.log("- Conference Room A (capacity: 20)")
  console.log("- Meeting Room B (capacity: 10)")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
