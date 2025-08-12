const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🗑️  Deleting all existing data...")

  // Delete in correct order to avoid foreign key constraints
  await prisma.booking.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.classroom.deleteMany({})

  console.log("✅ All data deleted")

  console.log("🌱 Seeding database...")

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
      name: "Training Room B",
      capacity: 15,
      description: "Training room with whiteboards",
    },
  })

  console.log("✅ Database seeded successfully!")
  console.log("")
  console.log("🔑 Login credentials:")
  console.log("Admin: admin@example.com / password")
  console.log("User:  user@example.com / password")
  console.log("")
  console.log("Or use usernames:")
  console.log("Admin: admin / password")
  console.log("User:  user / password")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
