const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log("🔍 Checking database users...")

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        employeeId: true,
      },
    })

    console.log("📊 Found users:")
    users.forEach((user) => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`)
    })

    console.log(`\n✅ Total users: ${users.length}`)
  } catch (error) {
    console.error("❌ Error checking users:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
