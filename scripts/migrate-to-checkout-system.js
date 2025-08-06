const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  console.log("🔄 Migrating to tool checkout system...")

  try {
    // Check if tools table exists
    let toolsTableExists = false
    try {
      await prisma.$queryRaw`SELECT 1 FROM "tools" LIMIT 1`
      toolsTableExists = true
    } catch (e) {
      console.log("Tools table doesn't exist, will create it...")
    }

    if (!toolsTableExists) {
      // Create tools table
      console.log("Creating tools table...")
      await prisma.$executeRaw`
        CREATE TABLE "tools" (
          "id" TEXT NOT NULL,
          "isReturnable" BOOLEAN NOT NULL DEFAULT true,
          "maxCheckoutDays" INTEGER NOT NULL DEFAULT 7,
          CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
        )
      `

      await prisma.$executeRaw`
        ALTER TABLE "tools" ADD CONSTRAINT "tools_id_fkey" 
        FOREIGN KEY ("id") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      `

      console.log("✅ Tools table created")
    } else {
      // Add maxCheckoutDays column if it doesn't exist
      try {
        await prisma.$executeRaw`ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "maxCheckoutDays" INTEGER NOT NULL DEFAULT 7`
        console.log("✅ Added maxCheckoutDays column")
      } catch (e) {
        console.log("maxCheckoutDays column already exists")
      }

      // Remove calibration columns if they exist
      try {
        await prisma.$executeRaw`ALTER TABLE "tools" DROP COLUMN IF EXISTS "calibrationDueDate"`
        await prisma.$executeRaw`ALTER TABLE "tools" DROP COLUMN IF EXISTS "currentHolderId"`
        await prisma.$executeRaw`ALTER TABLE "tools" DROP COLUMN IF EXISTS "issuedDate"`
        console.log("✅ Removed calibration columns")
      } catch (e) {
        console.log("Calibration columns already removed")
      }
    }

    // Check if tool_checkouts table exists
    let checkoutsTableExists = false
    try {
      await prisma.$queryRaw`SELECT 1 FROM "tool_checkouts" LIMIT 1`
      checkoutsTableExists = true
    } catch (e) {
      console.log("Tool checkouts table doesn't exist, will create it...")
    }

    if (!checkoutsTableExists) {
      // Create tool_checkouts table
      console.log("Creating tool_checkouts table...")
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

      // Add foreign key constraints
      await prisma.$executeRaw`
        ALTER TABLE "tool_checkouts" ADD CONSTRAINT "tool_checkouts_toolId_fkey" 
        FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      `

      await prisma.$executeRaw`
        ALTER TABLE "tool_checkouts" ADD CONSTRAINT "tool_checkouts_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      `

      // Create indexes
      await prisma.$executeRaw`CREATE INDEX "tool_checkouts_toolId_idx" ON "tool_checkouts"("toolId")`
      await prisma.$executeRaw`CREATE INDEX "tool_checkouts_userId_idx" ON "tool_checkouts"("userId")`
      await prisma.$executeRaw`CREATE INDEX "tool_checkouts_status_idx" ON "tool_checkouts"("status")`
      await prisma.$executeRaw`CREATE INDEX "tool_checkouts_dueDate_idx" ON "tool_checkouts"("dueDate")`

      console.log("✅ Tool checkouts table created with indexes")
    }

    // Create sample tool entries for existing materials that should be tools
    console.log("Creating tool entries for returnable materials...")

    // Find materials that should be tools (based on naming patterns)
    const toolMaterials = await prisma.$queryRaw`
      SELECT id FROM "Material" 
      WHERE "name" ILIKE '%wrench%' 
         OR "name" ILIKE '%drill%' 
         OR "name" ILIKE '%caliper%'
         OR "name" ILIKE '%tool%'
         OR "partNumber" LIKE 'TRQ-%'
         OR "partNumber" LIKE 'DRL-%'
         OR "partNumber" LIKE 'CAL-%'
    `

    for (const material of toolMaterials) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "tools" ("id", "isReturnable", "maxCheckoutDays")
          VALUES (${material.id}, true, 7)
          ON CONFLICT ("id") DO NOTHING
        `
      } catch (e) {
        // Tool entry might already exist, that's okay
      }
    }

    console.log("✅ Tool entries created")
    console.log("🎉 Migration to checkout system complete!")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
