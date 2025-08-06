import { Pool, type PoolClient } from "pg"

// Database configuration for local development
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "material_management",
  user: process.env.DB_USER || "material_user",
  password: process.env.DB_PASSWORD || "your_secure_password",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
}

// Create a connection pool
const pool = new Pool(dbConfig)

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err)
})

// Database query function with error handling
export async function query(text: string, params?: any[]): Promise<any> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } catch (error) {
    console.error("Database query error:", error)
    console.error("Query:", text)
    console.error("Params:", params)
    throw error
  } finally {
    client.release()
  }
}

// Transaction helper
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Transaction error:", error)
    throw error
  } finally {
    client.release()
  }
}

// Set current user for audit logging
export async function setCurrentUser(userId: string, client?: PoolClient): Promise<void> {
  const queryClient = client || pool
  await queryClient.query(`SET LOCAL app.current_user_id = '${userId}'`)
}

// Health check function
export async function healthCheck(): Promise<{ healthy: boolean; message: string; details?: any }> {
  try {
    const result = await query("SELECT 1 as health, NOW() as timestamp, version() as pg_version")
    return {
      healthy: true,
      message: "Database connection successful",
      details: {
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].pg_version,
        config: {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          user: dbConfig.user,
        },
      },
    }
  } catch (error) {
    console.error("Database health check failed:", error)
    return {
      healthy: false,
      message: "Database connection failed",
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
        config: {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          user: dbConfig.user,
        },
      },
    }
  }
}

// Close pool (for graceful shutdown)
export async function closePool(): Promise<void> {
  await pool.end()
}

// Get pool status
export function getPoolStatus() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  }
}

export default pool
