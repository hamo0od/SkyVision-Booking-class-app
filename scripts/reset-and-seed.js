const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🗑️  Deleting all users and bookings...")

  // Delete all bookings first (foreign key constraint)
  await prisma.booking.deleteMany({})
  console.log("✅ Deleted all bookings")

  // Delete all users
  await prisma.user.deleteMany({})
  console.log("✅ Deleted all users")

  console.log("🌱 Creating fresh users...")

  // Hash password
  const hashedPassword = await bcrypt.hash("password", 12)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      username: "admin",
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
      tokenVersion: 0,
    },
  })

  // Create regular user
  const user = await prisma.user.create({
    data: {
      email: "user@example.com",
      username: "user",
      password: hashedPassword,
      name: "Regular User",
      role: "USER",
      tokenVersion: 0,
    },
  })

  console.log("✅ Database reset and seeded successfully!")
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
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
