const { Pool } = require("pg")
const fs = require("fs")
const path = require("path")

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "material_management",
  user: process.env.DB_USER || "material_user",
  password: process.env.DB_PASSWORD || "your_secure_password",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
}

async function initializeDatabase() {
  const pool = new Pool(dbConfig)

  try {
    console.log("🔗 Connecting to database...")
    console.log(`Host: ${dbConfig.host}:${dbConfig.port}`)
    console.log(`Database: ${dbConfig.database}`)
    console.log(`User: ${dbConfig.user}`)

    // Test connection
    const client = await pool.connect()
    console.log("✅ Database connection successful!")

    // Read and execute SQL files in order
    const sqlFiles = ["01-create-database-schema.sql", "02-create-triggers.sql", "03-seed-data.sql"]

    for (const sqlFile of sqlFiles) {
      const filePath = path.join(__dirname, sqlFile)

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${sqlFile}`)
        continue
      }

      console.log(`📄 Executing ${sqlFile}...`)
      const sqlContent = fs.readFileSync(filePath, "utf8")

      try {
        await client.query(sqlContent)
        console.log(`✅ ${sqlFile} executed successfully`)
      } catch (error) {
        console.error(`❌ Error executing ${sqlFile}:`, error.message)
        throw error
      }
    }

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)

    console.log("\n📊 Created tables:")
    tablesResult.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`)
    })

    // Check if seed data was inserted
    const userCount = await client.query("SELECT COUNT(*) FROM users")
    const materialCount = await client.query("SELECT COUNT(*) FROM materials")
    const categoryCount = await client.query("SELECT COUNT(*) FROM categories")

    console.log("\n📈 Seed data summary:")
    console.log(`  - Users: ${userCount.rows[0].count}`)
    console.log(`  - Materials: ${materialCount.rows[0].count}`)
    console.log(`  - Categories: ${categoryCount.rows[0].count}`)

    client.release()
    console.log("\n🎉 Database initialization completed successfully!")
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message)
    console.error("\nTroubleshooting tips:")
    console.error("1. Make sure PostgreSQL is running")
    console.error("2. Verify database credentials in .env.local")
    console.error("3. Ensure the database and user exist")
    console.error("4. Check if the database is accessible from your machine")
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
}

module.exports = { initializeDatabase }
