const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🗑️  Deleting all existing data...")

  // Delete in correct order to avoid foreign key constraints
  await prisma.booking.deleteMany({})
  console.log("✅ Deleted all bookings")

  await prisma.user.deleteMany({})
  console.log("✅ Deleted all users")

  await prisma.classroom.deleteMany({})
  console.log("✅ Deleted all classrooms")

  console.log("🌱 Seeding database...")

  // Hash passwords
  const hashedPassword = await bcrypt.hash("password", 12)
  console.log("Generated password hash")

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      username: "admin",
      name: "Admin User",
      password: hashedPassword,
      role: "ADMIN",
      tokenVersion: 0,
    },
  })
  console.log("✅ Created admin user:", { id: admin.id, username: admin.username, email: admin.email })

  // Create regular user
  const user = await prisma.user.create({
    data: {
      email: "user@example.com",
      username: "user",
      name: "Regular User",
      password: hashedPassword,
      role: "USER",
      tokenVersion: 0,
    },
  })
  console.log("✅ Created regular user:", { id: user.id, username: user.username, email: user.email })

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

  console.log("✅ Created sample classrooms")

  console.log("\n🎉 Database seeded successfully!")
  console.log("\n🔑 Login credentials:")
  console.log("Username: admin | Password: password")
  console.log("Username: user  | Password: password")
  console.log("\nOr use emails:")
  console.log("Email: admin@example.com | Password: password")
  console.log("Email: user@example.com  | Password: password")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
