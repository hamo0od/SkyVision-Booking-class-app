const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function addToolIdColumn() {
  try {
    console.log("Adding toolId column to material_requests table...")

    // Add the toolId column
    await prisma.$executeRaw`
      ALTER TABLE material_requests 
      ADD COLUMN IF NOT EXISTS "toolId" TEXT;
    `

    console.log("✅ Successfully added toolId column")

    // Add foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE material_requests 
      ADD CONSTRAINT IF NOT EXISTS fk_material_requests_tool 
      FOREIGN KEY ("toolId") REFERENCES tools(id);
    `

    console.log("✅ Successfully added foreign key constraint")
  } catch (error) {
    console.error("❌ Error adding toolId column:", error)
  } finally {
    await prisma.$disconnect()
  }
}

addToolIdColumn()
