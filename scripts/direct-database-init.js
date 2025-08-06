const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")
const { Pool } = require("pg")

// Create a direct connection to the database
async function directDatabaseInit() {
  console.log("🔄 Starting direct database initialization...")

  try {
    // Get database connection details from environment
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

    if (!connectionString) {
      throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required")
    }

    console.log("📊 Connecting to database directly...")
    const pool = new Pool({ connectionString })

    // Test connection
    await pool.query("SELECT NOW()")
    console.log("✅ Database connection successful")

    // Drop all tables if they exist
    console.log("🗑️ Dropping existing tables...")
    await pool.query(`
      DROP TABLE IF EXISTS "_ToolToAircraftType" CASCADE;
      DROP TABLE IF EXISTS "_MaterialToAircraftType" CASCADE;
      DROP TABLE IF EXISTS "StockMovement" CASCADE;
      DROP TABLE IF EXISTS "MaterialRequest" CASCADE;
      DROP TABLE IF EXISTS "item_checkouts" CASCADE;
      DROP TABLE IF EXISTS "Tool" CASCADE;
      DROP TABLE IF EXISTS "Material" CASCADE;
      DROP TABLE IF EXISTS "AircraftType" CASCADE;
      DROP TABLE IF EXISTS "Location" CASCADE;
      DROP TABLE IF EXISTS "Category" CASCADE;
      DROP TABLE IF EXISTS "User" CASCADE;
    `)

    // Drop all enum types
    console.log("🗑️ Dropping existing enum types...")
    await pool.query(`
      DROP TYPE IF EXISTS "UserRole" CASCADE;
      DROP TYPE IF EXISTS "MaterialStatus" CASCADE;
      DROP TYPE IF EXISTS "ToolStatus" CASCADE;
      DROP TYPE IF EXISTS "CheckoutStatus" CASCADE;
      DROP TYPE IF EXISTS "CheckoutPriority" CASCADE;
      DROP TYPE IF EXISTS "CategoryType" CASCADE;
      DROP TYPE IF EXISTS "LocationType" CASCADE;
      DROP TYPE IF EXISTS "RequestPriority" CASCADE;
      DROP TYPE IF EXISTS "RequestStatus" CASCADE;
      DROP TYPE IF EXISTS "MovementType" CASCADE;
    `)

    // Create enum types
    console.log("🏗️ Creating enum types...")
    await pool.query(`
      CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STOREKEEPER', 'TECHNICIAN');
      CREATE TYPE "MaterialStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');
      CREATE TYPE "ToolStatus" AS ENUM ('AVAILABLE', 'CHECKED_OUT', 'OVERDUE', 'PENDING_RETURN', 'MAINTENANCE', 'CALIBRATION', 'RETIRED');
      CREATE TYPE "CheckoutStatus" AS ENUM ('PENDING', 'CHECKED_OUT', 'OVERDUE', 'PENDING_RETURN', 'RETURNED', 'LOST', 'DAMAGED');
      CREATE TYPE "CheckoutPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
      CREATE TYPE "CategoryType" AS ENUM ('GENERAL', 'MATERIAL', 'TOOL', 'CONSUMABLE');
      CREATE TYPE "LocationType" AS ENUM ('WAREHOUSE', 'TOOL_CRIB', 'MAINTENANCE_AREA', 'LINE_STATION');
      CREATE TYPE "RequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
      CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'ISSUED', 'COMPLETED', 'REJECTED');
      CREATE TYPE "MovementType" AS ENUM ('ISSUE', 'RETURN', 'PURCHASE', 'ADJUSTMENT', 'CHECKOUT', 'CHECKIN');
    `)

    // Create tables
    console.log("🏗️ Creating tables...")

    // User table
    await pool.query(`
      CREATE TABLE "User" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT UNIQUE NOT NULL,
        "name" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "role" "UserRole" NOT NULL,
        "department" TEXT,
        "employeeId" TEXT UNIQUE NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    // Category table
    await pool.query(`
      CREATE TABLE "Category" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT UNIQUE NOT NULL,
        "description" TEXT,
        "type" "CategoryType" NOT NULL DEFAULT 'GENERAL',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    // Location table
    await pool.query(`
      CREATE TABLE "Location" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT UNIQUE NOT NULL,
        "description" TEXT,
        "type" "LocationType" NOT NULL DEFAULT 'WAREHOUSE',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    // AircraftType table
    await pool.query(`
      CREATE TABLE "AircraftType" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT UNIQUE NOT NULL,
        "description" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    // Material table
    await pool.query(`
      CREATE TABLE "Material" (
        "id" TEXT PRIMARY KEY,
        "partNumber" TEXT UNIQUE NOT NULL,
        "serialNumber" TEXT,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "categoryId" TEXT NOT NULL REFERENCES "Category"("id"),
        "locationId" TEXT NOT NULL REFERENCES "Location"("id"),
        "stockQty" INTEGER NOT NULL DEFAULT 0,
        "unit" TEXT NOT NULL,
        "minimumLevel" INTEGER NOT NULL DEFAULT 0,
        "status" "MaterialStatus" NOT NULL DEFAULT 'ACTIVE',
        "isConsumable" BOOLEAN NOT NULL DEFAULT true,
        "lastUpdated" TIMESTAMP NOT NULL DEFAULT NOW(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "createdById" TEXT NOT NULL REFERENCES "User"("id"),
        "updatedById" TEXT NOT NULL REFERENCES "User"("id")
      );
    `)

    // Tool table
    await pool.query(`
      CREATE TABLE "Tool" (
        "id" TEXT PRIMARY KEY,
        "partNumber" TEXT UNIQUE NOT NULL,
        "serialNumber" TEXT UNIQUE NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "categoryId" TEXT NOT NULL REFERENCES "Category"("id"),
        "locationId" TEXT NOT NULL REFERENCES "Location"("id"),
        "status" "ToolStatus" NOT NULL DEFAULT 'AVAILABLE',
        "maxCheckoutDays" INTEGER NOT NULL DEFAULT 7,
        "requiresCalibration" BOOLEAN NOT NULL DEFAULT false,
        "lastMaintenanceDate" TIMESTAMP,
        "nextMaintenanceDate" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "createdById" TEXT NOT NULL REFERENCES "User"("id"),
        "updatedById" TEXT NOT NULL REFERENCES "User"("id")
      );
    `)

    // ItemCheckout table
    await pool.query(`
      CREATE TABLE "item_checkouts" (
        "id" TEXT PRIMARY KEY,
        "checkoutNumber" TEXT UNIQUE NOT NULL,
        "materialId" TEXT REFERENCES "Material"("id"),
        "toolId" TEXT REFERENCES "Tool"("id"),
        "userId" TEXT NOT NULL REFERENCES "User"("id"),
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "purpose" TEXT NOT NULL,
        "checkoutDate" TIMESTAMP NOT NULL DEFAULT NOW(),
        "expectedReturnDate" TIMESTAMP,
        "actualReturnDate" TIMESTAMP,
        "status" "CheckoutStatus" NOT NULL DEFAULT 'CHECKED_OUT',
        "priority" "CheckoutPriority" NOT NULL DEFAULT 'NORMAL',
        "issuedById" TEXT REFERENCES "User"("id"),
        "issuedDate" TIMESTAMP,
        "returnedById" TEXT REFERENCES "User"("id"),
        "returnedDate" TIMESTAMP,
        "notes" TEXT,
        "returnNotes" TEXT,
        "condition" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    // MaterialRequest table
    await pool.query(`
      CREATE TABLE "MaterialRequest" (
        "id" TEXT PRIMARY KEY,
        "requestNumber" TEXT UNIQUE NOT NULL,
        "requesterId" TEXT NOT NULL REFERENCES "User"("id"),
        "materialId" TEXT REFERENCES "Material"("id"),
        "toolId" TEXT REFERENCES "Tool"("id"),
        "quantityRequested" INTEGER NOT NULL,
        "quantityIssued" INTEGER,
        "purpose" TEXT NOT NULL,
        "priority" "RequestPriority" NOT NULL,
        "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
        "requestDate" TIMESTAMP NOT NULL DEFAULT NOW(),
        "approvedDate" TIMESTAMP,
        "approvedById" TEXT REFERENCES "User"("id"),
        "issuedDate" TIMESTAMP,
        "issuedById" TEXT REFERENCES "User"("id"),
        "returnDate" TIMESTAMP,
        "notes" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    // StockMovement table
    await pool.query(`
      CREATE TABLE "StockMovement" (
        "id" TEXT PRIMARY KEY,
        "materialId" TEXT NOT NULL REFERENCES "Material"("id"),
        "type" "MovementType" NOT NULL,
        "quantity" INTEGER NOT NULL,
        "previousStock" INTEGER NOT NULL,
        "newStock" INTEGER NOT NULL,
        "requestId" TEXT REFERENCES "MaterialRequest"("id"),
        "performedById" TEXT NOT NULL REFERENCES "User"("id"),
        "performedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "notes" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    // Junction tables
    await pool.query(`
      CREATE TABLE "_MaterialToAircraftType" (
        "A" TEXT NOT NULL REFERENCES "Material"("id") ON DELETE CASCADE,
        "B" TEXT NOT NULL REFERENCES "AircraftType"("id") ON DELETE CASCADE,
        UNIQUE("A", "B")
      );
      
      CREATE INDEX "_MaterialToAircraftType_B_index" ON "_MaterialToAircraftType"("B");
      
      CREATE TABLE "_ToolToAircraftType" (
        "A" TEXT NOT NULL REFERENCES "Tool"("id") ON DELETE CASCADE,
        "B" TEXT NOT NULL REFERENCES "AircraftType"("id") ON DELETE CASCADE,
        UNIQUE("A", "B")
      );
      
      CREATE INDEX "_ToolToAircraftType_B_index" ON "_ToolToAircraftType"("B");
    `)

    // Create indexes
    console.log("🔍 Creating indexes...")
    await pool.query(`
      CREATE INDEX "Material_stockQty_idx" ON "Material"("stockQty");
      CREATE INDEX "Tool_status_idx" ON "Tool"("status");
      CREATE INDEX "item_checkouts_materialId_idx" ON "item_checkouts"("materialId");
      CREATE INDEX "item_checkouts_toolId_idx" ON "item_checkouts"("toolId");
      CREATE INDEX "item_checkouts_userId_idx" ON "item_checkouts"("userId");
      CREATE INDEX "item_checkouts_status_idx" ON "item_checkouts"("status");
      CREATE INDEX "item_checkouts_checkoutDate_idx" ON "item_checkouts"("checkoutDate");
      CREATE INDEX "item_checkouts_expectedReturnDate_idx" ON "item_checkouts"("expectedReturnDate");
      CREATE INDEX "MaterialRequest_materialId_idx" ON "MaterialRequest"("materialId");
      CREATE INDEX "MaterialRequest_toolId_idx" ON "MaterialRequest"("toolId");
      CREATE INDEX "MaterialRequest_status_idx" ON "MaterialRequest"("status");
    `)

    // Seed data
    console.log("🌱 Seeding initial data...")

    // Create admin user
    const hashedPassword = await bcrypt.hash("password123", 10)

    await pool.query(
      `
      INSERT INTO "User" ("id", "email", "name", "password", "role", "department", "employeeId")
      VALUES 
        ('admin-user-id', 'admin@airline.com', 'System Admin', $1, 'ADMIN', 'IT', 'EMP001'),
        ('storekeeper-id', 'storekeeper@airline.com', 'John Smith', $1, 'STOREKEEPER', 'Warehouse', 'EMP002'),
        ('tech-user-id', 'technician@airline.com', 'Mike Johnson', $1, 'TECHNICIAN', 'Maintenance', 'EMP003')
    `,
      [hashedPassword],
    )

    // Create categories
    await pool.query(`
      INSERT INTO "Category" ("id", "name", "description", "type")
      VALUES 
        ('cat-1', 'Engine Parts', 'Aircraft engine components', 'MATERIAL'),
        ('cat-2', 'Hydraulic Systems', 'Hydraulic system components', 'MATERIAL'),
        ('cat-3', 'Electrical', 'Electrical components and wiring', 'MATERIAL'),
        ('cat-4', 'Hand Tools', 'Manual tools for maintenance', 'TOOL'),
        ('cat-5', 'Power Tools', 'Electric and pneumatic tools', 'TOOL')
    `)

    // Create locations
    await pool.query(`
      INSERT INTO "Location" ("id", "name", "description", "type")
      VALUES 
        ('loc-1', 'Main Warehouse', 'Primary storage facility', 'WAREHOUSE'),
        ('loc-2', 'Tool Crib A', 'Tool storage area A', 'TOOL_CRIB'),
        ('loc-3', 'Line Maintenance', 'Line maintenance storage', 'LINE_STATION')
    `)

    // Create aircraft types
    await pool.query(`
      INSERT INTO "AircraftType" ("id", "name", "description")
      VALUES 
        ('ac-1', 'Boeing 737', 'Boeing 737 series aircraft'),
        ('ac-2', 'Airbus A320', 'Airbus A320 family'),
        ('ac-3', 'All Aircraft', 'Universal components')
    `)

    // Create materials
    await pool.query(`
      INSERT INTO "Material" ("id", "partNumber", "name", "description", "categoryId", "locationId", "stockQty", "unit", "minimumLevel", "createdById", "updatedById")
      VALUES 
        ('mat-1', 'HYD-001', 'Hydraulic Seal', 'O-ring seal for hydraulic systems', 'cat-2', 'loc-1', 50, 'Each', 10, 'admin-user-id', 'admin-user-id'),
        ('mat-2', 'ENG-002', 'Fuel Injector', 'Engine fuel injector assembly', 'cat-1', 'loc-1', 8, 'Each', 2, 'admin-user-id', 'admin-user-id')
    `)

    // Create tools
    await pool.query(`
      INSERT INTO "Tool" ("id", "partNumber", "serialNumber", "name", "description", "categoryId", "locationId", "createdById", "updatedById")
      VALUES 
        ('tool-1', 'TRQ-001', 'TRQ123456', 'Torque Wrench 50-250 Nm', 'Precision torque wrench', 'cat-4', 'loc-2', 'admin-user-id', 'admin-user-id'),
        ('tool-2', 'DRL-002', 'DRL789012', 'Pneumatic Drill Kit', 'Complete pneumatic drill set', 'cat-5', 'loc-2', 'admin-user-id', 'admin-user-id')
    `)

    // Create material-aircraft type relationships
    await pool.query(`
      INSERT INTO "_MaterialToAircraftType" ("A", "B")
      VALUES 
        ('mat-1', 'ac-3'),
        ('mat-2', 'ac-1')
    `)

    // Create tool-aircraft type relationships
    await pool.query(`
      INSERT INTO "_ToolToAircraftType" ("A", "B")
      VALUES 
        ('tool-1', 'ac-3'),
        ('tool-2', 'ac-1')
    `)

    console.log("✅ Database initialization complete!")
    console.log("📋 Next steps:")
    console.log("   1. Run: npx prisma generate")
    console.log("   2. Restart your development server")

    await pool.end()
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    process.exit(1)
  }
}

directDatabaseInit()
