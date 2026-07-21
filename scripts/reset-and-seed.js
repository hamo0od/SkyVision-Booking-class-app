const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🗑️  Deleting all existing data...")

  // Delete in correct order to handle foreign key constraints
  await prisma.booking.deleteMany({})
  await prisma.classroom.deleteMany({})
  await prisma.user.deleteMany({})

  console.log("✅ All data deleted")

  console.log("🌱 Creating fresh users...")

  // Create admin user
  const adminPassword = await bcrypt.hash("password", 12)
  await prisma.user.create({
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
  await prisma.user.create({
    data: {
      email: "user@example.com",
      username: "user",
      name: "Regular User",
      password: userPassword,
      role: "USER",
      tokenVersion: 0,
    },
  })

  console.log("✅ Users created:")
  console.log("   Admin: admin@example.com / password")
  console.log("   User:  user@example.com / password")

  console.log("🏫 Creating sample classrooms...")

  await prisma.classroom.create({
    data: {
      name: "Conference Room A",
      capacity: 20,
      description: "Large conference room with projector",
    },
  })

  await prisma.classroom.create({
    data: {
      name: "Meeting Room B",
      capacity: 10,
      description: "Small meeting room for team discussions",
    },
  })

  console.log("✅ Sample classrooms created")
  console.log("🎉 Database reset and seeded successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
