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

  // Hash password with same method as your app
  const hashedPassword = await bcrypt.hash("password", 12)
  console.log("Generated hash:", hashedPassword)

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
  console.log("✅ Created admin:", { id: admin.id, username: admin.username, email: admin.email })

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
  console.log("✅ Created user:", { id: user.id, username: user.username, email: user.email })

  // Verify the users were created correctly
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      tokenVersion: true,
      password: true,
    },
  })

  console.log("\n📋 All users in database:")
  allUsers.forEach((u) => {
    console.log(`- ${u.username} (${u.email}) - Role: ${u.role} - TokenVersion: ${u.tokenVersion}`)
    console.log(`  Password hash: ${u.password.substring(0, 20)}...`)
  })

  console.log("\n🔑 Login credentials:")
  console.log("Username: admin | Password: password")
  console.log("Username: user  | Password: password")
  console.log("\nOr use emails:")
  console.log("Email: admin@example.com | Password: password")
  console.log("Email: user@example.com  | Password: password")
}

main()
  .catch((e) => {
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
