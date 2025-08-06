const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🔄 Resetting and setting up database...")

  try {
    // Reset the database
    console.log("1. Resetting database...")
    await prisma.$executeRaw`DROP SCHEMA public CASCADE`
    await prisma.$executeRaw`CREATE SCHEMA public`
    await prisma.$executeRaw`GRANT ALL ON SCHEMA public TO postgres`
    await prisma.$executeRaw`GRANT ALL ON SCHEMA public TO public`

    console.log("✅ Database reset complete")

    // Push the schema to create all tables
    console.log("2. Creating database schema...")

    // We'll create the tables manually to ensure they exist
    await createTables()

    console.log("✅ Database schema created")

    // Seed the database
    console.log("3. Seeding database...")
    await seedDatabase()

    console.log("✅ Database seeded successfully")
    console.log("🎉 Database setup complete!")
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

  // Create Material table
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
      "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdById" TEXT NOT NULL,
      "updatedById" TEXT NOT NULL,
      CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
    )
  `

  await prisma.$executeRaw`CREATE UNIQUE INDEX "Material_partNumber_key" ON "Material"("partNumber")`

  // Create tools table
  await prisma.$executeRaw`
    CREATE TABLE "tools" (
      "id" TEXT NOT NULL,
      "isReturnable" BOOLEAN NOT NULL DEFAULT true,
      "maxCheckoutDays" INTEGER NOT NULL DEFAULT 7,
      CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
    )
  `

  // Create tool_checkouts table
  await prisma.$executeRaw`
    CREATE TABLE "tool_checkouts" (
      "id" TEXT NOT NULL,
      "toolId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "checkoutDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dueDate" TIMESTAMP(3) NOT NULL,
      "returnDate" TIMESTAMP(3),
      "status" TEXT NOT NULL DEFAULT 'CHECKED_OUT',
      "notes" TEXT,
      "issuedById" TEXT,
      "returnedById" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "tool_checkouts_pkey" PRIMARY KEY ("id")
    )
  `

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

  // Create junction table for Material-AircraftType relationship
  await prisma.$executeRaw`
    CREATE TABLE "_MaterialToAircraftType" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL
    )
  `

  await prisma.$executeRaw`CREATE UNIQUE INDEX "_MaterialToAircraftType_AB_unique" ON "_MaterialToAircraftType"("A", "B")`
  await prisma.$executeRaw`CREATE INDEX "_MaterialToAircraftType_B_index" ON "_MaterialToAircraftType"("B")`

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
  await prisma.$executeRaw`
    ALTER TABLE "Material" ADD CONSTRAINT "Material_categoryId_fkey" 
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  `

  await prisma.$executeRaw`
    ALTER TABLE "Material" ADD CONSTRAINT "Material_locationId_fkey" 
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  `

  await prisma.$executeRaw`
    ALTER TABLE "Material" ADD CONSTRAINT "Material_createdById_fkey" 
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  `

  await prisma.$executeRaw`
    ALTER TABLE "Material" ADD CONSTRAINT "Material_updatedById_fkey" 
    FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  `

  await prisma.$executeRaw`
    ALTER TABLE "tools" ADD CONSTRAINT "tools_id_fkey" 
    FOREIGN KEY ("id") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  `

  await prisma.$executeRaw`
    ALTER TABLE "tool_checkouts" ADD CONSTRAINT "tool_checkouts_toolId_fkey" 
    FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  `

  await prisma.$executeRaw`
    ALTER TABLE "tool_checkouts" ADD CONSTRAINT "tool_checkouts_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  `

  await prisma.$executeRaw`
    ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_requesterId_fkey" 
    FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  `

  await prisma.$executeRaw`
    ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_materialId_fkey" 
    FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  `

  await prisma.$executeRaw`
    ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_approvedById_fkey" 
    FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
  `

  await prisma.$executeRaw`
    ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_issuedById_fkey" 
    FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
  `

  await prisma.$executeRaw`
    ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_materialId_fkey" 
    FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  `

  await prisma.$executeRaw`
    ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_requestId_fkey" 
    FOREIGN KEY ("requestId") REFERENCES "MaterialRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE
  `

  await prisma.$executeRaw`
    ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_performedById_fkey" 
    FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  `

  await prisma.$executeRaw`
    ALTER TABLE "_MaterialToAircraftType" ADD CONSTRAINT "_MaterialToAircraftType_A_fkey" 
    FOREIGN KEY ("A") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE
  `

  await prisma.$executeRaw`
    ALTER TABLE "_MaterialToAircraftType" ADD CONSTRAINT "_MaterialToAircraftType_B_fkey" 
    FOREIGN KEY ("B") REFERENCES "AircraftType"("id") ON DELETE CASCADE ON UPDATE CASCADE
  `

  // Create indexes for better performance
  await prisma.$executeRaw`CREATE INDEX "tool_checkouts_toolId_idx" ON "tool_checkouts"("toolId")`
  await prisma.$executeRaw`CREATE INDEX "tool_checkouts_userId_idx" ON "tool_checkouts"("userId")`
  await prisma.$executeRaw`CREATE INDEX "tool_checkouts_status_idx" ON "tool_checkouts"("status")`
  await prisma.$executeRaw`CREATE INDEX "tool_checkouts_dueDate_idx" ON "tool_checkouts"("dueDate")`
}

async function seedDatabase() {
  // Create users
  const hashedPassword = await bcrypt.hash("password123", 10)

  const admin = await prisma.$executeRaw`
    INSERT INTO "User" ("id", "email", "name", "password", "role", "department", "employeeId")
    VALUES ('61d9ea94-97ce-4dbb-b88c-041b971d736a', 'admin@airline.com', 'System Admin', ${hashedPassword}, 'ADMIN', 'IT', 'EMP001')
  `

  const storekeeper = await prisma.$executeRaw`
    INSERT INTO "User" ("id", "email", "name", "password", "role", "department", "employeeId")
    VALUES ('71d9ea94-97ce-4dbb-b88c-041b971d736b', 'storekeeper@airline.com', 'John Smith', ${hashedPassword}, 'STOREKEEPER', 'Warehouse', 'EMP002')
  `

  const technician = await prisma.$executeRaw`
    INSERT INTO "User" ("id", "email", "name", "password", "role", "department", "employeeId")
    VALUES ('81d9ea94-97ce-4dbb-b88c-041b971d736c', 'technician@airline.com', 'Mike Johnson', ${hashedPassword}, 'TECHNICIAN', 'Maintenance', 'EMP003')
  `

  // Create categories
  await prisma.$executeRaw`
    INSERT INTO "Category" ("id", "name", "description")
    VALUES 
      ('cat1', 'Engine Parts', 'Aircraft engine components'),
      ('cat2', 'Hydraulic Systems', 'Hydraulic system components'),
      ('cat3', 'Electrical', 'Electrical components and wiring'),
      ('cat4', 'Hand Tools', 'Manual tools for maintenance'),
      ('cat5', 'Power Tools', 'Electric and pneumatic tools'),
      ('cat6', 'Measuring Tools', 'Precision measuring instruments')
  `

  // Create locations
  await prisma.$executeRaw`
    INSERT INTO "Location" ("id", "name", "description")
    VALUES 
      ('loc1', 'Main Warehouse', 'Primary storage facility'),
      ('loc2', 'Tool Crib A', 'Tool storage area A'),
      ('loc3', 'Tool Crib B', 'Tool storage area B'),
      ('loc4', 'Engine Shop', 'Engine maintenance area'),
      ('loc5', 'Line Maintenance', 'Line maintenance storage')
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

  // Create materials
  await prisma.$executeRaw`
    INSERT INTO "Material" ("id", "partNumber", "serialNumber", "name", "description", "categoryId", "locationId", "stockQty", "unit", "minimumLevel", "createdById", "updatedById")
    VALUES 
      ('a9163ea5-3497-4a11-807f-b446425cec52', 'HYD-001', NULL, 'Hydraulic Seal', 'O-ring seal for hydraulic systems', 'cat2', 'loc1', 10, 'Each', 5, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('b9163ea5-3497-4a11-807f-b446425cec53', 'ENG-002', 'SN123456', 'Fuel Injector', 'Engine fuel injector assembly', 'cat1', 'loc4', 3, 'Each', 2, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('c9163ea5-3497-4a11-807f-b446425cec54', 'ELC-003', NULL, 'Wire Harness', 'Electrical wire harness', 'cat3', 'loc1', 15, 'Meter', 10, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('d9163ea5-3497-4a11-807f-b446425cec55', 'TRQ-001', 'TRQ123456', 'Torque Wrench 50-250 Nm', 'Precision torque wrench', 'cat4', 'loc2', 3, 'Each', 2, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('e9163ea5-3497-4a11-807f-b446425cec56', 'DRL-002', 'DRL789012', 'Pneumatic Drill Kit', 'Complete pneumatic drill set', 'cat5', 'loc3', 1, 'Kit', 1, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a'),
      ('f9163ea5-3497-4a11-807f-b446425cec57', 'CAL-003', 'CAL345678', 'Digital Caliper', 'Precision digital caliper', 'cat6', 'loc2', 2, 'Each', 2, '61d9ea94-97ce-4dbb-b88c-041b971d736a', '61d9ea94-97ce-4dbb-b88c-041b971d736a')
  `

  // Create tools (for returnable materials)
  await prisma.$executeRaw`
    INSERT INTO "tools" ("id", "isReturnable", "maxCheckoutDays")
    VALUES 
      ('d9163ea5-3497-4a11-807f-b446425cec55', true, 7),
      ('e9163ea5-3497-4a11-807f-b446425cec56', true, 14),
      ('f9163ea5-3497-4a11-807f-b446425cec57', true, 3)
  `

  // Create material-aircraft type relationships
  await prisma.$executeRaw`
    INSERT INTO "_MaterialToAircraftType" ("A", "B")
    VALUES 
      ('a9163ea5-3497-4a11-807f-b446425cec52', 'ac4'),
      ('b9163ea5-3497-4a11-807f-b446425cec53', 'ac1'),
      ('b9163ea5-3497-4a11-807f-b446425cec53', 'ac3'),
      ('c9163ea5-3497-4a11-807f-b446425cec54', 'ac4'),
      ('d9163ea5-3497-4a11-807f-b446425cec55', 'ac4'),
      ('e9163ea5-3497-4a11-807f-b446425cec56', 'ac1'),
      ('e9163ea5-3497-4a11-807f-b446425cec56', 'ac2'),
      ('f9163ea5-3497-4a11-807f-b446425cec57', 'ac4')
  `

  console.log("✅ Sample data created successfully")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
