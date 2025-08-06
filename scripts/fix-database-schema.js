const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function fixDatabaseSchema() {
  try {
    console.log("🔧 Fixing database schema...")

    // First, check if toolId column exists
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'material_requests' 
      AND column_name = 'toolId';
    `

    if (result.length === 0) {
      console.log("Adding toolId column...")
      await prisma.$executeRaw`
        ALTER TABLE material_requests 
        ADD COLUMN "toolId" TEXT;
      `

      // Add foreign key constraint
      await prisma.$executeRaw`
        ALTER TABLE material_requests 
        ADD CONSTRAINT fk_material_requests_tool 
        FOREIGN KEY ("toolId") REFERENCES tools(id);
      `

      console.log("✅ Added toolId column and constraint")
    } else {
      console.log("✅ toolId column already exists")
    }

    // Test basic queries
    console.log("Testing database connections...")

    const userCount = await prisma.user.count()
    console.log(`✅ Users table: ${userCount} records`)

    const materialCount = await prisma.material.count()
    console.log(`✅ Materials table: ${materialCount} records`)

    const toolCount = await prisma.tool.count()
    console.log(`✅ Tools table: ${toolCount} records`)

    const requestCount = await prisma.materialRequest.count()
    console.log(`✅ Requests table: ${requestCount} records`)

    console.log("🎉 Database schema is working correctly!")
  } catch (error) {
    console.error("❌ Error fixing database schema:", error)

    // Try to regenerate Prisma client
    console.log("Attempting to regenerate Prisma client...")
    const { exec } = require("child_process")
    exec("npx prisma generate", (error, stdout, stderr) => {
      if (error) {
        console.error("Error regenerating Prisma client:", error)
      } else {
        console.log("✅ Prisma client regenerated")
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

fixDatabaseSchema()
