const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🔄 Setting up separated Materials and Tools system...")

  try {
    // Reset the database
    console.log("1. Resetting database...")
    await prisma.$executeRaw`DROP SCHEMA public CASCADE`
    await prisma.$executeRaw`CREATE SCHEMA public`
    await prisma.$executeRaw`GRANT ALL ON SCHEMA public TO postgres`
    await prisma.$executeRaw`GRANT ALL ON SCHEMA public TO public`

    console.log("✅ Database reset complete")

    // Create all tables
    console.log("2. Creating database schema...")
    await createTables()
    console.log("✅ Database schema created")

    // Seed the database
    console.log("3. Seeding database...")
    await seedDatabase()
    console.log("✅ Database seeded successfully")

    console.log("🎉 Separated Materials and Tools system setup complete!")
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function createTables() {
  // Create User table
  await prisma.$executeRaw`
    CREATE TABLE "User" (
      "id" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "department" TEXT,
      "employeeId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "User_pkey" PRIMARY KEY ("id")
    )
  `
  await prisma.$executeRaw`CREATE UNIQUE INDEX "User_email_key" ON "User"("email")`
  await prisma.$executeRaw`CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId")`

  // Create Category table
  await prisma.$executeRaw`
    CREATE TABLE "Category" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "type" TEXT NOT NULL DEFAULT 'GENERAL',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
    )
  `
  await prisma.$executeRaw`CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name")`

  // Create Location table
  await prisma.$executeRaw`
    CREATE TABLE "Location" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "type" TEXT NOT NULL DEFAULT 'WAREHOUSE',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
    )
  `
  await prisma.$executeRaw`CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name")`

  // Create AircraftType table
  await prisma.$executeRaw`
    CREATE TABLE "AircraftType" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AircraftType_pkey" PRIMARY KEY ("id")
    )
  `
  await prisma.$executeRaw`CREATE UNIQUE INDEX "AircraftType_name_key" ON "AircraftType"("name")`

  // Create Material table (consumable items)
  await prisma.$executeRaw`
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
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "isConsumable" BOOLEAN NOT NULL DEFAULT true,
      "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdById" TEXT NOT NULL,
      "updatedById" TEXT NOT NULL,
      CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
    )
  `
  await prisma.$executeRaw`CREATE UNIQUE INDEX "Material_partNumber_key" ON "Material"("partNumber")`

  // Create Tool table (returnable items)
  await prisma.$executeRaw`
    CREATE TABLE "Tool" (
      "id" TEXT NOT NULL,
      "partNumber" TEXT NOT NULL,
      "serialNumber" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "categoryId" TEXT NOT NULL,
      "locationId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
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
  `
  await prisma.$executeRaw`CREATE UNIQUE INDEX "Tool_partNumber_key" ON "Tool"("partNumber")`
  await prisma.$executeRaw`CREATE UNIQUE INDEX "Tool_serialNumber_key" ON "Tool"("serialNumber")`

  // Create ItemCheckout table (universal checkout system)
  await prisma.$executeRaw`
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
      "status" TEXT NOT NULL DEFAULT 'CHECKED_OUT',
      "priority" TEXT NOT NULL DEFAULT 'NORMAL',
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
  `
  await prisma.$executeRaw`CREATE UNIQUE INDEX "item_checkouts_checkoutNumber_key" ON "item_checkouts"("checkoutNumber")`

  // Create MaterialRequest table
  await prisma.$executeRaw`
    CREATE TABLE "MaterialRequest" (
      "id" TEXT NOT NULL,
      "requestNumber" TEXT NOT NULL,
      "requesterId" TEXT NOT NULL,
      "materialId" TEXT NOT NULL,
      "quantityRequested" INTEGER NOT NULL,
      "quantityIssued" INTEGER,
      "purpose" TEXT NOT NULL,
      "priority" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
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
  `
  await prisma.$executeRaw`CREATE UNIQUE INDEX "MaterialRequest_requestNumber_key" ON "MaterialRequest"("requestNumber")`

  // Create StockMovement table
  await prisma.$executeRaw`
    CREATE TABLE "StockMovement" (
      "id" TEXT NOT NULL,
      "materialId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
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
  `

  // Create junction tables
  await prisma.$executeRaw`
    CREATE TABLE "_MaterialToAircraftType" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL
    )
  `
  await prisma.$executeRaw`CREATE UNIQUE INDEX "_MaterialToAircraftType_AB_unique" ON "_MaterialToAircraftType"("A", "B")`
  await prisma.$executeRaw`CREATE INDEX "_MaterialToAircraftType_B_index" ON "_MaterialToAircraftType"("B")`

  await prisma.$executeRaw`
    CREATE TABLE "_ToolToAircraftType" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL
    )
  `
  await prisma.$executeRaw`CREATE UNIQUE INDEX "_ToolToAircraftType_AB_unique" ON "_ToolToAircraftType"("A", "B")`
  await prisma.$executeRaw`CREATE INDEX "_ToolToAircraftType_B_index" ON "_ToolToAircraftType"("B")`

  // Create AuditLog table
  await prisma.$executeRaw`
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
  `

  // Create Notification table
  await prisma.$executeRaw`
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
  `

  // Add foreign key constraints
  await addForeignKeys()

  // Create indexes for performance
  await createIndexes()
}

async function addForeignKeys() {
  // Material foreign keys
  await prisma.$executeRaw`ALTER TABLE "Material" ADD CONSTRAINT "Material_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "Material" ADD CONSTRAINT "Material_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "Material" ADD CONSTRAINT "Material_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "Material" ADD CONSTRAINT "Material_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`

  // Tool foreign keys
  await prisma.$executeRaw`ALTER TABLE "Tool" ADD CONSTRAINT "Tool_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "Tool" ADD CONSTRAINT "Tool_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "Tool" ADD CONSTRAINT "Tool_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "Tool" ADD CONSTRAINT "Tool_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`

  // ItemCheckout foreign keys
  await prisma.$executeRaw`ALTER TABLE "item_checkouts" ADD CONSTRAINT "item_checkouts_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "item_checkouts" ADD CONSTRAINT "item_checkouts_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE SET NULL ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "item_checkouts" ADD CONSTRAINT "item_checkouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "item_checkouts" ADD CONSTRAINT "item_checkouts_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "item_checkouts" ADD CONSTRAINT "item_checkouts_returnedById_fkey" FOREIGN KEY ("returnedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`

  // MaterialRequest foreign keys
  await prisma.$executeRaw`ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`

  // StockMovement foreign keys
  await prisma.$executeRaw`ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaterialRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`

  // Junction table foreign keys
  await prisma.$executeRaw`ALTER TABLE "_MaterialToAircraftType" ADD CONSTRAINT "_MaterialToAircraftType_A_fkey" FOREIGN KEY ("A") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "_MaterialToAircraftType" ADD CONSTRAINT "_MaterialToAircraftType_B_fkey" FOREIGN KEY ("B") REFERENCES "AircraftType"("id") ON DELETE CASCADE ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "_ToolToAircraftType" ADD CONSTRAINT "_ToolToAircraftType_A_fkey" FOREIGN KEY ("A") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE`
  await prisma.$executeRaw`ALTER TABLE "_ToolToAircraftType" ADD CONSTRAINT "_ToolToAircraftType_B_fkey" FOREIGN KEY ("B") REFERENCES "AircraftType"("id") ON DELETE CASCADE ON UPDATE CASCADE`
}

async function createIndexes() {
  // Performance indexes
  await prisma.$executeRaw`CREATE INDEX "item_checkouts_materialId_idx" ON "item_checkouts"("materialId")`
  await prisma.$executeRaw`CREATE INDEX "item_checkouts_toolId_idx" ON "item_checkouts"("toolId")`
  await prisma.$executeRaw`CREATE INDEX "item_checkouts_userId_idx" ON "item_checkouts"("userId")`
  await prisma.$executeRaw`CREATE INDEX "item_checkouts_status_idx" ON "item_checkouts"("status")`
  await prisma.$executeRaw`CREATE INDEX "item_checkouts_checkoutDate_idx" ON "item_checkouts"("checkoutDate")`
  await prisma.$executeRaw`CREATE INDEX "item_checkouts_expectedReturnDate_idx" ON "item_checkouts"("expectedReturnDate")`
  await prisma.$executeRaw`CREATE INDEX "Tool_status_idx" ON "Tool"("status")`
  await prisma.$executeRaw`CREATE INDEX "Material_stockQty_idx" ON "Material"("stockQty")`
}

async function seedDatabase() {
  const hashedPassword = await bcrypt.hash("password123", 10)

  // Create users
  await prisma.$executeRaw`
    INSERT INTO "User" ("id", "email", "name", "password", "role", "department", "employeeId")
    VALUES 
      ('61d9ea94-97ce-4dbb-b88c-041b971d736a', 'admin@airline.com', 'System Admin', ${hashedPassword}, 'ADMIN', 'IT', 'EMP001'),
      ('71d9ea94-97ce-4dbb-b88c-041b971d736b', 'storekeeper@airline.com', 'John Smith', ${hashedPassword}, 'STOREKEEPER', 'Warehouse', 'EMP002'),
      ('81d9ea94-97ce-4dbb-b88c-041b971d736c', 'technician@airline.com', 'Mike Johnson', ${hashedPassword}, 'TECHNICIAN', 'Maintenance', 'EMP003'),
      ('91d9ea94-97ce-4dbb-b88c-041b971d736d', 'tech2@airline.com', 'Sarah Wilson', ${hashedPassword}, 'TECHNICIAN', 'Line Maintenance', 'EMP004')
  `

  // Create categories
  await prisma.$executeRaw`
    INSERT INTO "Category" ("id", "name", "description", "type")
    VALUES 
      ('cat1', 'Engine Parts', 'Aircraft engine components', 'MATERIAL'),
      ('cat2', 'Hydraulic Systems', 'Hydraulic system components', 'MATERIAL'),
      ('cat3', 'Electrical', 'Electrical components and wiring', 'MATERIAL'),
      ('cat4', 'Hand Tools', 'Manual tools for maintenance', 'TOOL'),
      ('cat5', 'Power Tools', 'Electric and pneumatic tools', 'TOOL'),
      ('cat6', 'Measuring Tools', 'Precision measuring instruments', 'TOOL'),
      ('cat7', 'Consumables', 'Consumable materials and supplies', 'CONSUMABLE')
  `

  // Create locations
  await prisma.$executeRaw`
    INSERT INTO "Location" ("id", "name", "description", "type")
    VALUES 
      ('loc1', 'Main Warehouse', 'Primary storage facility', 'WAREHOUSE'),
      ('loc2', 'Tool Crib A', 'Tool storage area A', 'TOOL_CRIB'),
      ('loc3', 'Tool Crib B', 'Tool storage area B', 'TOOL_CRIB'),
      ('loc4', 'Engine Shop', 'Engine maintenance area', 'MAINTENANCE_AREA'),
      ('loc5', 'Line Maintenance', 'Line maintenance storage', 'LINE_STATION')
  `

  // Create aircraft types
  await prisma.$executeRaw`
    INSERT INTO "AircraftType" ("id", "name", "description")
    VALUES 
      ('ac1', 'Boeing 737', 'Boeing 737 series aircraft'),
      ('ac2', 'Airbus A320', 'Airbus A320 family'),
      ('ac3', 'Boeing 777', 'Boeing 777 series aircraft'),
      ('ac4', 'All Aircraft', 'Universal components')
  `

  // Create materials (consumable items)
  await prisma.$executeRaw`
    INSERT INTO "Material" ("id", "partNumber", "serialNumber", "name", "description", "categoryId", "locationId", "stockQty", "unit", "minimumLevel", "isConsumable", "createdById", "updatedById")
    VALUES 
      ('a9163ea5-3497-4a11-807f-b446425cec52', 'HYD-001', NULL, 'Hydraulic Seal', 'O-ring seal for hydraulic systems', 'cat2', 'loc1', 50, 'Each', 10, true, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('b9163ea5-3497-4a11-807f-b446425cec53', 'ENG-002', NULL, 'Fuel Injector', 'Engine fuel injector assembly', 'cat1', 'loc4', 8, 'Each', 2, false, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('c9163ea5-3497-4a11-807f-b446425cec54', 'ELC-003', NULL, 'Wire Harness', 'Electrical wire harness', 'cat3', 'loc1', 25, 'Meter', 5, true, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('d9163ea5-3497-4a11-807f-b446425cec55', 'CONS-001', NULL, 'Safety Wire', 'Stainless steel safety wire', 'cat7', 'loc1', 100, 'Meter', 20, true, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a')
  `

  // Create tools (returnable items)
  await prisma.$executeRaw`
    INSERT INTO "Tool" ("id", "partNumber", "serialNumber", "name", "description", "categoryId", "locationId", "status", "maxCheckoutDays", "requiresCalibration", "createdById", "updatedById")
    VALUES 
      ('t1163ea5-3497-4a11-807f-b446425cec56', 'TRQ-001', 'TRQ123456', 'Torque Wrench 50-250 Nm', 'Precision torque wrench', 'cat4', 'loc2', 'AVAILABLE', 7, true, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('t2163ea5-3497-4a11-807f-b446425cec57', 'DRL-002', 'DRL789012', 'Pneumatic Drill Kit', 'Complete pneumatic drill set', 'cat5', 'loc3', 'AVAILABLE', 14, false, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('t3163ea5-3497-4a11-807f-b446425cec58', 'CAL-003', 'CAL345678', 'Digital Caliper', 'Precision digital caliper', 'cat6', 'loc2', 'AVAILABLE', 3, true, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('t4163ea5-3497-4a11-807f-b446425cec59', 'TRQ-002', 'TRQ789123', 'Torque Wrench 10-50 Nm', 'Low range torque wrench', 'cat4', 'loc2', 'CHECKED_OUT', 7, true, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('t5163ea5-3497-4a11-807f-b446425cec60', 'MUL-001', 'MUL456789', 'Digital Multimeter', 'Precision electrical multimeter', 'cat6', 'loc2', 'AVAILABLE', 5, true, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a')
  `

  // Create material-aircraft type relationships
  await prisma.$executeRaw`
    INSERT INTO "_MaterialToAircraftType" ("A", "B")
    VALUES 
      ('a9163ea5-3497-4a11-807f-b446425cec52', 'ac4'),
      ('b9163ea5-3497-4a11-807f-b446425cec53', 'ac1'),
      ('b9163ea5-3497-4a11-807f-b446425cec53', 'ac3'),
      ('c9163ea5-3497-4a11-807f-b446425cec54', 'ac4'),
      ('d9163ea5-3497-4a11-807f-b446425cec55', 'ac4')
  `

  // Create tool-aircraft type relationships
  await prisma.$executeRaw`
    INSERT INTO "_ToolToAircraftType" ("A", "B")
    VALUES 
      ('t1163ea5-3497-4a11-807f-b446425cec56', 'ac4'),
      ('t2163ea5-3497-4a11-807f-b446425cec57', 'ac1'),
      ('t2163ea5-3497-4a11-807f-b446425cec57', 'ac2'),
      ('t3163ea5-3497-4a11-807f-b446425cec58', 'ac4'),
      ('t4163ea5-3497-4a11-807f-b446425cec59', 'ac4'),
      ('t5163ea5-3497-4a11-807f-b446425cec60', 'ac4')
  `

  // Create some sample checkouts
  await prisma.$executeRaw`
    INSERT INTO "item_checkouts" ("id", "checkoutNumber", "toolId", "userId", "quantity", "purpose", "checkoutDate", "expectedReturnDate", "status", "priority", "issuedById", "issuedDate", "notes")
    VALUES 
      ('co1', 'CHK001', 't4163ea5-3497-4a11-807f-b446425cec59', '81d9ea94-97ce-4dbb-b88c-041b971d736c', 1, 'Engine maintenance on AC001', '2024-06-01 08:00:00', '2024-06-08 17:00:00', 'CHECKED_OUT', 'NORMAL', '71d9ea94-97ce-4dbb-b88c-041b971d736b', '2024-06-01 08:15:00', 'Tool checked out for scheduled maintenance')
  `

  console.log("✅ Sample data created successfully")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
