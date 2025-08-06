const { Pool } = require("pg")

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "material_management",
  user: process.env.DB_USER || "material_user",
  password: process.env.DB_PASSWORD || "your_secure_password",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
}

async function resetDatabase() {
  const pool = new Pool(dbConfig)

  try {
    console.log("🔗 Connecting to database...")
    const client = await pool.connect()

    console.log("🗑️  Dropping all tables...")

    // Drop tables in reverse dependency order
    const dropTables = [
      "audit_logs",
      "notifications",
      "stock_movements",
      "material_requests",
      "tools",
      "material_aircraft",
      "materials",
      "aircraft_types",
      "locations",
      "categories",
      "users",
    ]

    for (const table of dropTables) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`)
        console.log(`  ✅ Dropped table: ${table}`)
      } catch (error) {
        console.log(`  ⚠️  Could not drop table ${table}: ${error.message}`)
      }
    }

    // Drop sequences
    await client.query("DROP SEQUENCE IF EXISTS request_number_seq CASCADE")
    console.log("  ✅ Dropped sequences")

    // Drop functions
    const functions = [
      "update_updated_at_column()",
      "audit_trigger_function()",
      "update_stock_on_movement()",
      "generate_request_number()",
    ]

    for (const func of functions) {
      try {
        await client.query(`DROP FUNCTION IF EXISTS ${func} CASCADE`)
        console.log(`  ✅ Dropped function: ${func}`)
      } catch (error) {
        console.log(`  ⚠️  Could not drop function ${func}: ${error.message}`)
      }
    }

    client.release()
    console.log("🎉 Database reset completed!")
    console.log("💡 Run 'npm run db:init' to recreate the database structure")
  } catch (error) {
    console.error("❌ Database reset failed:", error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  resetDatabase()
}

module.exports = { resetDatabase }
