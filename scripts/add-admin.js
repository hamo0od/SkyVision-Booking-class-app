const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

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
    console.log("Email: admin@example.com")
    console.log("Password: password")
  } catch (error) {
    console.error("Error adding admin user:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addAdmin()
