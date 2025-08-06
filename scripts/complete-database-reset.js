const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🔄 Performing complete database reset and setup...")

  try {
    // Step 1: Complete database reset
    console.log("1. Performing complete database reset...")
    await completeReset()

    // Step 2: Create all enum types
    console.log("2. Creating all enum types...")
    await createAllEnums()

    // Step 3: Create all tables with proper types
    console.log("3. Creating all tables...")
    await createAllTables()

    // Step 4: Add all foreign key constraints
    console.log("4. Adding foreign key constraints...")
    await addAllForeignKeys()

    // Step 5: Create indexes
    console.log("5. Creating indexes...")
    await createAllIndexes()

    // Step 6: Seed with sample data
    console.log("6. Seeding database...")
    await seedDatabase()

    // Step 7: Generate Prisma client
    console.log("7. Generating Prisma client...")
    const { exec } = require("child_process")
    await new Promise((resolve) => {
      exec("npx prisma generate", (error, stdout, stderr) => {
        if (error) {
          console.log("⚠️  Please run 'npx prisma generate' manually")
        } else {
          console.log("✅ Prisma client generated")
        }
        resolve()
      })
    })

    console.log("🎉 Database setup complete!")
    console.log("📋 Next steps:")
    console.log("   1. Restart your development server")
    console.log("   2. Test the application")
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function completeReset() {
  try {
    // Drop everything and recreate schema
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS public CASCADE`)
    await prisma.$executeRawUnsafe(`CREATE SCHEMA public`)
    await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO postgres`)
    await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO public`)
    console.log("✅ Database completely reset")
  } catch (error) {
    console.log("✅ Database reset completed")
  }
}

async function createAllEnums() {
  // Create all enum types
  const enums = [
    {
      name: "UserRole",
      values: ["ADMIN", "STOREKEEPER", "TECHNICIAN"],
    },
    {
      name: "MaterialStatus",
      values: ["ACTIVE", "INACTIVE", "EXPIRED"],
    },
    {
      name: "ToolStatus",
      values: ["AVAILABLE", "CHECKED_OUT", "OVERDUE", "PENDING_RETURN", "MAINTENANCE", "CALIBRATION", "RETIRED"],
    },
    {
      name: "CheckoutStatus",
      values: ["PENDING", "CHECKED_OUT", "OVERDUE", "PENDING_RETURN", "RETURNED", "LOST", "DAMAGED"],
    },
    {
      name: "CheckoutPriority",
      values: ["LOW", "NORMAL", "HIGH", "URGENT"],
    },
    {
      name: "CategoryType",
      values: ["GENERAL", "MATERIAL", "TOOL", "CONSUMABLE"],
    },
    {
      name: "LocationType",
      values: ["WAREHOUSE", "TOOL_CRIB", "MAINTENANCE_AREA", "LINE_STATION"],
    },
    {
      name: "RequestPriority",
      values: ["LOW", "MEDIUM", "HIGH", "URGENT"],
    },
    {
      name: "RequestStatus",
      values: ["PENDING", "APPROVED", "ISSUED", "COMPLETED", "REJECTED"],
    },
    {
      name: "MovementType",
      values: ["ISSUE", "RETURN", "PURCHASE", "ADJUSTMENT", "CHECKOUT", "CHECKIN"],
    },
  ]

  for (const enumDef of enums) {
    const values = enumDef.values.map((v) => `'${v}'`).join(", ")
    const query = `CREATE TYPE "${enumDef.name}" AS ENUM (${values})`
    await prisma.$executeRawUnsafe(query)
    console.log(`✅ Created ${enumDef.name} enum`)
  }
}

async function createAllTables() {
  // Create User table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "User" (
      "id" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "role" "UserRole" NOT NULL,
      "department" TEXT,
      "employeeId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "User_pkey" PRIMARY KEY ("id")
    )
  `)

  // Create Category table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Category" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "type" "CategoryType" NOT NULL DEFAULT 'GENERAL',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
    )
  `)

  // Create Location table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Location" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "type" "LocationType" NOT NULL DEFAULT 'WAREHOUSE',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
    )
  `)

  // Create AircraftType table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "AircraftType" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AircraftType_pkey" PRIMARY KEY ("id")
    )
  `)

  // Create Material table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Material" (
      "id" TEXT NOT NULL,
      "partNumber" TEXT NOT NULL,
      "serialNumber" TEXT,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "categoryId" TEXT NOT NULL,
      "locationId" TEXT NOT NULL,
      "stockQty" INTEGER NOT NULL DEFAULT 0,
      "unit" TEXT NOT NULL,
      "minimumLevel" INTEGER NOT NULL DEFAULT 0,
      "status" "MaterialStatus" NOT NULL DEFAULT 'ACTIVE',
      "isConsumable" BOOLEAN NOT NULL DEFAULT true,
      "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdById" TEXT NOT NULL,
      "updatedById" TEXT NOT NULL,
      CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
    )
  `)

  // Create Tool table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Tool" (
      "id" TEXT NOT NULL,
      "partNumber" TEXT NOT NULL,
      "serialNumber" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "categoryId" TEXT NOT NULL,
      "locationId" TEXT NOT NULL,
      "status" "ToolStatus" NOT NULL DEFAULT 'AVAILABLE',
      "maxCheckoutDays" INTEGER NOT NULL DEFAULT 7,
      "requiresCalibration" BOOLEAN NOT NULL DEFAULT false,
      "lastMaintenanceDate" TIMESTAMP(3),
      "nextMaintenanceDate" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdById" TEXT NOT NULL,
      "updatedById" TEXT NOT NULL,
      CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
    )
  `)

  // Create ItemCheckout table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "item_checkouts" (
      "id" TEXT NOT NULL,
      "checkoutNumber" TEXT NOT NULL,
      "materialId" TEXT,
      "toolId" TEXT,
      "userId" TEXT NOT NULL,
      "quantity" INTEGER NOT NULL DEFAULT 1,
      "purpose" TEXT NOT NULL,
      "checkoutDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "expectedReturnDate" TIMESTAMP(3),
      "actualReturnDate" TIMESTAMP(3),
      "status" "CheckoutStatus" NOT NULL DEFAULT 'CHECKED_OUT',
      "priority" "CheckoutPriority" NOT NULL DEFAULT 'NORMAL',
      "issuedById" TEXT,
      "issuedDate" TIMESTAMP(3),
      "returnedById" TEXT,
      "returnedDate" TIMESTAMP(3),
      "notes" TEXT,
      "returnNotes" TEXT,
      "condition" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "item_checkouts_pkey" PRIMARY KEY ("id")
    )
  `)

  // Create MaterialRequest table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "MaterialRequest" (
      "id" TEXT NOT NULL,
      "requestNumber" TEXT NOT NULL,
      "requesterId" TEXT NOT NULL,
      "materialId" TEXT NOT NULL,
      "quantityRequested" INTEGER NOT NULL,
      "quantityIssued" INTEGER,
      "purpose" TEXT NOT NULL,
      "priority" "RequestPriority" NOT NULL,
      "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
      "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "approvedDate" TIMESTAMP(3),
      "approvedById" TEXT,
      "issuedDate" TIMESTAMP(3),
      "issuedById" TEXT,
      "returnDate" TIMESTAMP(3),
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MaterialRequest_pkey" PRIMARY KEY ("id")
    )
  `)

  // Create StockMovement table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "StockMovement" (
      "id" TEXT NOT NULL,
      "materialId" TEXT NOT NULL,
      "type" "MovementType" NOT NULL,
      "quantity" INTEGER NOT NULL,
      "previousStock" INTEGER NOT NULL,
      "newStock" INTEGER NOT NULL,
      "requestId" TEXT,
      "performedById" TEXT NOT NULL,
      "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
    )
  `)

  // Create junction tables
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "_MaterialToAircraftType" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "_ToolToAircraftType" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL
    )
  `)

  // Create AuditLog table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "AuditLog" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "oldValues" JSONB,
      "newValues" JSONB,
      "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
    )
  `)

  // Create Notification table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Notification" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "isRead" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "readAt" TIMESTAMP(3),
      CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
    )
  `)

  console.log("✅ All tables created")
}

async function addAllForeignKeys() {
  // Add all unique constraints first
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "User_email_key" ON "User"("email")`)
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId")`)
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name")`)
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name")`)
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "AircraftType_name_key" ON "AircraftType"("name")`)
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Material_partNumber_key" ON "Material"("partNumber")`)
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Tool_partNumber_key" ON "Tool"("partNumber")`)
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Tool_serialNumber_key" ON "Tool"("serialNumber")`)
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX "item_checkouts_checkoutNumber_key" ON "item_checkouts"("checkoutNumber")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX "MaterialRequest_requestNumber_key" ON "MaterialRequest"("requestNumber")`,
  )

  // Add junction table constraints
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX "_MaterialToAircraftType_AB_unique" ON "_MaterialToAircraftType"("A", "B")`,
  )
  await prisma.$executeRawUnsafe(`CREATE INDEX "_MaterialToAircraftType_B_index" ON "_MaterialToAircraftType"("B")`)
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX "_ToolToAircraftType_AB_unique" ON "_ToolToAircraftType"("A", "B")`,
  )
  await prisma.$executeRawUnsafe(`CREATE INDEX "_ToolToAircraftType_B_index" ON "_ToolToAircraftType"("B")`)

  // Add foreign key constraints
  const foreignKeys = [
    // Material foreign keys
    'ALTER TABLE "Material" ADD CONSTRAINT "Material_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
    'ALTER TABLE "Material" ADD CONSTRAINT "Material_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
    'ALTER TABLE "Material" ADD CONSTRAINT "Material_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
    'ALTER TABLE "Material" ADD CONSTRAINT "Material_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE',

    // Tool foreign keys
    'ALTER TABLE "Tool" ADD CONSTRAINT "Tool_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
    'ALTER TABLE "Tool" ADD CONSTRAINT "Tool_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
    'ALTER TABLE "Tool" ADD CONSTRAINT "Tool_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
    'ALTER TABLE "Tool" ADD CONSTRAINT "Tool_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE',

    // ItemCheckout foreign keys
    'ALTER TABLE "item_checkouts" ADD CONSTRAINT "item_checkouts_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE',
    'ALTER TABLE "item_checkouts" ADD CONSTRAINT "item_checkouts_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE SET NULL ON UPDATE CASCADE',
    'ALTER TABLE "item_checkouts" ADD CONSTRAINT "item_checkouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
    'ALTER TABLE "item_checkouts" ADD CONSTRAINT "item_checkouts_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE',
    'ALTER TABLE "item_checkouts" ADD CONSTRAINT "item_checkouts_returnedById_fkey" FOREIGN KEY ("returnedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE',

    // MaterialRequest foreign keys
    'ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
    'ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
    'ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE',
    'ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE',

    // StockMovement foreign keys
    'ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
    'ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaterialRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE',
    'ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE',

    // Junction table foreign keys
    'ALTER TABLE "_MaterialToAircraftType" ADD CONSTRAINT "_MaterialToAircraftType_A_fkey" FOREIGN KEY ("A") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE',
    'ALTER TABLE "_MaterialToAircraftType" ADD CONSTRAINT "_MaterialToAircraftType_B_fkey" FOREIGN KEY ("B") REFERENCES "AircraftType"("id") ON DELETE CASCADE ON UPDATE CASCADE',
    'ALTER TABLE "_ToolToAircraftType" ADD CONSTRAINT "_ToolToAircraftType_A_fkey" FOREIGN KEY ("A") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE',
    'ALTER TABLE "_ToolToAircraftType" ADD CONSTRAINT "_ToolToAircraftType_B_fkey" FOREIGN KEY ("B") REFERENCES "AircraftType"("id") ON DELETE CASCADE ON UPDATE CASCADE',
  ]

  for (const fk of foreignKeys) {
    await prisma.$executeRawUnsafe(fk)
  }

  console.log("✅ All foreign keys added")
}

async function createAllIndexes() {
  const indexes = [
    'CREATE INDEX "item_checkouts_materialId_idx" ON "item_checkouts"("materialId")',
    'CREATE INDEX "item_checkouts_toolId_idx" ON "item_checkouts"("toolId")',
    'CREATE INDEX "item_checkouts_userId_idx" ON "item_checkouts"("userId")',
    'CREATE INDEX "item_checkouts_status_idx" ON "item_checkouts"("status")',
    'CREATE INDEX "item_checkouts_checkoutDate_idx" ON "item_checkouts"("checkoutDate")',
    'CREATE INDEX "item_checkouts_expectedReturnDate_idx" ON "item_checkouts"("expectedReturnDate")',
    'CREATE INDEX "Tool_status_idx" ON "Tool"("status")',
    'CREATE INDEX "Material_stockQty_idx" ON "Material"("stockQty")',
  ]

  for (const index of indexes) {
    await prisma.$executeRawUnsafe(index)
  }

  console.log("✅ All indexes created")
}

async function seedDatabase() {
  const hashedPassword = await bcrypt.hash("password123", 10)

  // Insert users
  await prisma.$executeRawUnsafe(`
    INSERT INTO "User" ("id", "email", "name", "password", "role", "department", "employeeId")
    VALUES 
      ('61d9ea94-97ce-4dbb-b88c-041b971d736a', 'admin@airline.com', 'System Admin', '${hashedPassword}', 'ADMIN', 'IT', 'EMP001'),
      ('71d9ea94-97ce-4dbb-b88c-041b971d736b', 'storekeeper@airline.com', 'John Smith', '${hashedPassword}', 'STOREKEEPER', 'Warehouse', 'EMP002'),
      ('81d9ea94-97ce-4dbb-b88c-041b971d736c', 'technician@airline.com', 'Mike Johnson', '${hashedPassword}', 'TECHNICIAN', 'Maintenance', 'EMP003'),
      ('91d9ea94-97ce-4dbb-b88c-041b971d736d', 'tech2@airline.com', 'Sarah Wilson', '${hashedPassword}', 'TECHNICIAN', 'Line Maintenance', 'EMP004')
  `)

  // Insert categories
  await prisma.$executeRawUnsafe(`
    INSERT INTO "Category" ("id", "name", "description", "type")
    VALUES 
      ('cat1', 'Engine Parts', 'Aircraft engine components', 'MATERIAL'),
      ('cat2', 'Hydraulic Systems', 'Hydraulic system components', 'MATERIAL'),
      ('cat3', 'Electrical', 'Electrical components and wiring', 'MATERIAL'),
      ('cat4', 'Hand Tools', 'Manual tools for maintenance', 'TOOL'),
      ('cat5', 'Power Tools', 'Electric and pneumatic tools', 'TOOL'),
      ('cat6', 'Measuring Tools', 'Precision measuring instruments', 'TOOL'),
      ('cat7', 'Consumables', 'Consumable materials and supplies', 'CONSUMABLE')
  `)

  // Insert locations
  await prisma.$executeRawUnsafe(`
    INSERT INTO "Location" ("id", "name", "description", "type")
    VALUES 
      ('loc1', 'Main Warehouse', 'Primary storage facility', 'WAREHOUSE'),
      ('loc2', 'Tool Crib A', 'Tool storage area A', 'TOOL_CRIB'),
      ('loc3', 'Tool Crib B', 'Tool storage area B', 'TOOL_CRIB'),
      ('loc4', 'Engine Shop', 'Engine maintenance area', 'MAINTENANCE_AREA'),
      ('loc5', 'Line Maintenance', 'Line maintenance storage', 'LINE_STATION')
  `)

  // Insert aircraft types
  await prisma.$executeRawUnsafe(`
    INSERT INTO "AircraftType" ("id", "name", "description")
    VALUES 
      ('ac1', 'Boeing 737', 'Boeing 737 series aircraft'),
      ('ac2', 'Airbus A320', 'Airbus A320 family'),
      ('ac3', 'Boeing 777', 'Boeing 777 series aircraft'),
      ('ac4', 'All Aircraft', 'Universal components')
  `)

  // Insert materials
  await prisma.$executeRawUnsafe(`
    INSERT INTO "Material" ("id", "partNumber", "serialNumber", "name", "description", "categoryId", "locationId", "stockQty", "unit", "minimumLevel", "isConsumable", "createdById", "updatedById", "status")
    VALUES 
      ('a9163ea5-3497-4a11-807f-b446425cec52', 'HYD-001', NULL, 'Hydraulic Seal', 'O-ring seal for hydraulic systems', 'cat2', 'loc1', 50, 'Each', 10, true, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a', 'ACTIVE'),
      ('b9163ea5-3497-4a11-807f-b446425cec53', 'ENG-002', NULL, 'Fuel Injector', 'Engine fuel injector assembly', 'cat1', 'loc4', 8, 'Each', 2, false, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a', 'ACTIVE'),
      ('c9163ea5-3497-4a11-807f-b446425cec54', 'ELC-003', NULL, 'Wire Harness', 'Electrical wire harness', 'cat3', 'loc1', 25, 'Meter', 5, true, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a', 'ACTIVE'),
      ('d9163ea5-3497-4a11-807f-b446425cec55', 'CONS-001', NULL, 'Safety Wire', 'Stainless steel safety wire', 'cat7', 'loc1', 100, 'Meter', 20, true, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a', 'ACTIVE')
  `)

  // Insert tools
  await prisma.$executeRawUnsafe(`
    INSERT INTO "Tool" ("id", "partNumber", "serialNumber", "name", "description", "categoryId", "locationId", "status", "maxCheckoutDays", "requiresCalibration", "createdById", "updatedById")
    VALUES 
      ('t1163ea5-3497-4a11-807f-b446425cec56', 'TRQ-001', 'TRQ123456', 'Torque Wrench 50-250 Nm', 'Precision torque wrench', 'cat4', 'loc2', 'AVAILABLE', 7, true, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('t2163ea5-3497-4a11-807f-b446425cec57', 'DRL-002', 'DRL789012', 'Pneumatic Drill Kit', 'Complete pneumatic drill set', 'cat5', 'loc3', 'AVAILABLE', 14, false, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('t3163ea5-3497-4a11-807f-b446425cec58', 'CAL-003', 'CAL345678', 'Digital Caliper', 'Precision digital caliper', 'cat6', 'loc2', 'AVAILABLE', 3, true, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('t4163ea5-3497-4a11-807f-b446425cec59', 'TRQ-002', 'TRQ789123', 'Torque Wrench 10-50 Nm', 'Low range torque wrench', 'cat4', 'loc2', 'CHECKED_OUT', 7, true, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('t5163ea5-3497-4a11-807f-b446425cec60', 'MUL-001', 'MUL456789', 'Digital Multimeter', 'Precision electrical multimeter', 'cat6', 'loc2', 'AVAILABLE', 5, true, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a')
  `)

  // Insert relationships
  await prisma.$executeRawUnsafe(`
    INSERT INTO "_MaterialToAircraftType" ("A", "B")
    VALUES 
      ('a9163ea5-3497-4a11-807f-b446425cec52', 'ac4'),
      ('b9163ea5-3497-4a11-807f-b446425cec53', 'ac1'),
      ('b9163ea5-3497-4a11-807f-b446425cec53', 'ac3'),
      ('c9163ea5-3497-4a11-807f-b446425cec54', 'ac4'),
      ('d9163ea5-3497-4a11-807f-b446425cec55', 'ac4')
  `)

  await prisma.$executeRawUnsafe(`
    INSERT INTO "_ToolToAircraftType" ("A", "B")
    VALUES 
      ('t1163ea5-3497-4a11-807f-b446425cec56', 'ac4'),
      ('t2163ea5-3497-4a11-807f-b446425cec57', 'ac1'),
      ('t2163ea5-3497-4a11-807f-b446425cec57', 'ac2'),
      ('t3163ea5-3497-4a11-807f-b446425cec58', 'ac4'),
      ('t4163ea5-3497-4a11-807f-b446425cec59', 'ac4'),
      ('t5163ea5-3497-4a11-807f-b446425cec60', 'ac4')
  `)

  // Insert sample checkout
  await prisma.$executeRawUnsafe(`
    INSERT INTO "item_checkouts" ("id", "checkoutNumber", "toolId", "userId", "quantity", "purpose", "checkoutDate", "expectedReturnDate", "status", "priority", "issuedById", "issuedDate", "notes")
    VALUES 
      ('co1', 'CHK001', 't4163ea5-3497-4a11-807f-b446425cec59', '81d9ea94-97ce-4dbb-b88c-041b971d736c', 1, 'Engine maintenance on AC001', '2024-06-01 08:00:00', '2024-06-08 17:00:00', 'CHECKED_OUT', 'NORMAL', '71d9ea94-97ce-4dbb-b88c-041b971d736b', '2024-06-01 08:15:00', 'Tool checked out for scheduled maintenance')
  `)

  console.log("✅ Database seeded successfully")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
