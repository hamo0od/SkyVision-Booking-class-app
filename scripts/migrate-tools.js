// Migration script for tools system
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  console.log("Starting tools system migration...")

  try {
    // Check if the maxCheckoutDays column exists
    let hasMaxCheckoutDays = false
    try {
      // Try to query a tool with maxCheckoutDays
      await prisma.$queryRaw`SELECT "maxCheckoutDays" FROM "tools" LIMIT 1`
      hasMaxCheckoutDays = true
      console.log("✅ maxCheckoutDays column already exists")
    } catch (e) {
      console.log("❌ maxCheckoutDays column does not exist yet")
    }

    if (!hasMaxCheckoutDays) {
      console.log("Adding maxCheckoutDays column to tools table...")
      await prisma.$executeRaw`ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "maxCheckoutDays" INTEGER NOT NULL DEFAULT 7`
      console.log("✅ Added maxCheckoutDays column")
    }

    // Check if the tool_checkouts table exists
    let hasToolCheckouts = false
    try {
      await prisma.$queryRaw`SELECT * FROM "tool_checkouts" LIMIT 1`
      hasToolCheckouts = true
      console.log("✅ tool_checkouts table already exists")
    } catch (e) {
      console.log("❌ tool_checkouts table does not exist yet")
    }

    if (!hasToolCheckouts) {
      console.log("Creating tool_checkouts table...")
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "tool_checkouts" (
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

      await prisma.$executeRaw`
        ALTER TABLE "tool_checkouts" 
        ADD CONSTRAINT "tool_checkouts_toolId_fkey" 
        FOREIGN KEY ("toolId") REFERENCES "tools"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE
      `

      await prisma.$executeRaw`
        ALTER TABLE "tool_checkouts" 
        ADD CONSTRAINT "tool_checkouts_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE
      `

      console.log("✅ Created tool_checkouts table with foreign keys")
    }

    // Remove calibration-related columns
    console.log("Removing calibration-related columns...")
    await prisma.$executeRaw`ALTER TABLE "tools" DROP COLUMN IF EXISTS "calibrationDueDate"`
    await prisma.$executeRaw`ALTER TABLE "tools" DROP COLUMN IF EXISTS "currentHolderId"`
    await prisma.$executeRaw`ALTER TABLE "tools" DROP COLUMN IF EXISTS "issuedDate"`
    console.log("✅ Removed calibration-related columns")

    // Create indexes for better performance
    console.log("Creating indexes...")
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "tool_checkouts_toolId_idx" ON "tool_checkouts"("toolId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "tool_checkouts_userId_idx" ON "tool_checkouts"("userId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "tool_checkouts_status_idx" ON "tool_checkouts"("status")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "tool_checkouts_dueDate_idx" ON "tool_checkouts"("dueDate")`
    console.log("✅ Created indexes")

    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
