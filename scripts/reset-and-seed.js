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

  console.log("🌱 Creating new users...")

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
  console.log("✅ Created admin user:", { email: admin.email, username: admin.username })

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
  console.log("✅ Created regular user:", { email: user.email, username: user.username })

  console.log("\n🎉 Seeding completed!")
  console.log("\n📝 Login credentials:")
  console.log("Admin: admin@example.com / password (or username: admin)")
  console.log("User:  user@example.com / password (or username: user)")
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
