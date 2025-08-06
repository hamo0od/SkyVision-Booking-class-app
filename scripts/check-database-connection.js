const { PrismaClient } = require("@prisma/client")

async function checkDatabaseConnection() {
  console.log("🔍 Checking database connection...")

  // Get database URL from environment or use default
  const databaseUrl =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/material_management?schema=public"

  console.log(`Using database URL: ${databaseUrl.replace(/\/\/.*:.*@/, "//****:****@")}`)

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })

  try {
    // Try to query the database
    const result = await prisma.$queryRaw`SELECT 1 as connected`
    console.log("✅ Database connection successful!")
    console.log(result)

    // Check if required tables exist
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `
      console.log("\n📋 Database tables:")
      tables.forEach((table) => {
        console.log(`- ${table.table_name}`)
      })
    } catch (error) {
      console.log("⚠️ Could not check tables:", error.message)
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    console.log("\n🔧 Troubleshooting tips:")
    console.log("1. Check if PostgreSQL is running")
    console.log("2. Verify database credentials in .env file")
    console.log("3. Make sure the database exists")
    console.log("4. Check network connectivity to the database server")
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabaseConnection()
