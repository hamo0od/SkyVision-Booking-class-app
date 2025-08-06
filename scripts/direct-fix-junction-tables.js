const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  console.log("🔄 Directly fixing junction tables...")

  try {
    // Check if the tables exist by directly querying PostgreSQL system tables
    const checkTableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('_ToolToAircraftType', '_MaterialToAircraftType');
    `

    const existingTables = await prisma.$queryRawUnsafe(checkTableQuery)
    console.log("Existing junction tables:", existingTables)

    // Create _ToolToAircraftType table if it doesn't exist
    if (!existingTables.some((t) => t.table_name === "_ToolToAircraftType")) {
      console.log("Creating _ToolToAircraftType table...")

      await prisma.$executeRawUnsafe(`
        CREATE TABLE "_ToolToAircraftType" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL
        );
      `)

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX "_ToolToAircraftType_AB_unique" ON "_ToolToAircraftType"("A", "B");
      `)

      await prisma.$executeRawUnsafe(`
        CREATE INDEX "_ToolToAircraftType_B_index" ON "_ToolToAircraftType"("B");
      `)

      // Add foreign key constraints
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "_ToolToAircraftType" 
        ADD CONSTRAINT "_ToolToAircraftType_A_fkey" 
        FOREIGN KEY ("A") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `)

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "_ToolToAircraftType" 
        ADD CONSTRAINT "_ToolToAircraftType_B_fkey" 
        FOREIGN KEY ("B") REFERENCES "AircraftType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `)

      console.log("✅ _ToolToAircraftType table created")
    } else {
      console.log("✅ _ToolToAircraftType table already exists")
    }

    // Create _MaterialToAircraftType table if it doesn't exist
    if (!existingTables.some((t) => t.table_name === "_MaterialToAircraftType")) {
      console.log("Creating _MaterialToAircraftType table...")

      await prisma.$executeRawUnsafe(`
        CREATE TABLE "_MaterialToAircraftType" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL
        );
      `)

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX "_MaterialToAircraftType_AB_unique" ON "_MaterialToAircraftType"("A", "B");
      `)

      await prisma.$executeRawUnsafe(`
        CREATE INDEX "_MaterialToAircraftType_B_index" ON "_MaterialToAircraftType"("B");
      `)

      // Add foreign key constraints
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "_MaterialToAircraftType" 
        ADD CONSTRAINT "_MaterialToAircraftType_A_fkey" 
        FOREIGN KEY ("A") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `)

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "_MaterialToAircraftType" 
        ADD CONSTRAINT "_MaterialToAircraftType_B_fkey" 
        FOREIGN KEY ("B") REFERENCES "AircraftType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `)

      console.log("✅ _MaterialToAircraftType table created")
    } else {
      console.log("✅ _MaterialToAircraftType table already exists")
    }

    // Verify tables were created
    const verifyTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('_ToolToAircraftType', '_MaterialToAircraftType');
    `

    const verifiedTables = await prisma.$queryRawUnsafe(verifyTablesQuery)
    console.log("Verified junction tables:", verifiedTables)

    if (verifiedTables.length === 2) {
      console.log("✅ Both junction tables exist")

      // Add sample data
      console.log("🔄 Adding sample relationships...")

      // Get tools and aircraft types
      const tools = await prisma.tool.findMany({ take: 5 })
      const aircraftTypes = await prisma.aircraftType.findMany({ take: 4 })

      if (tools.length > 0 && aircraftTypes.length > 0) {
        // Add some sample relationships
        for (const tool of tools) {
          // Connect each tool to at least one aircraft type
          const randomAircraftType = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)]

          await prisma.$executeRawUnsafe(`
            INSERT INTO "_ToolToAircraftType" ("A", "B")
            VALUES ('${tool.id}', '${randomAircraftType.id}')
            ON CONFLICT DO NOTHING;
          `)
        }

        // Do the same for materials
        const materials = await prisma.material.findMany({ take: 5 })

        if (materials.length > 0) {
          for (const material of materials) {
            const randomAircraftType = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)]

            await prisma.$executeRawUnsafe(`
              INSERT INTO "_MaterialToAircraftType" ("A", "B")
              VALUES ('${material.id}', '${randomAircraftType.id}')
              ON CONFLICT DO NOTHING;
            `)
          }
        }

        console.log("✅ Sample relationships added")
      }
    } else {
      console.log("❌ Failed to create junction tables")
    }

    console.log("🎉 Junction tables fix complete!")
    console.log("📋 Next steps:")
    console.log("   1. Run 'npx prisma generate'")
    console.log("   2. Restart your development server")
    console.log("   3. Test the application")
  } catch (error) {
    console.error("❌ Error fixing junction tables:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
