const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  console.log("🔄 Fixing junction table names...")

  try {
    // Check if the tables exist by directly querying PostgreSQL system tables
    const checkTableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('_AircraftTypeToTool', '_AircraftTypeToMaterial');
    `

    const existingTables = await prisma.$queryRawUnsafe(checkTableQuery)
    console.log("Existing junction tables:", existingTables)

    // Create _AircraftTypeToTool table if it doesn't exist
    if (!existingTables.some((t) => t.table_name === "_AircraftTypeToTool")) {
      console.log("Creating _AircraftTypeToTool table...")

      await prisma.$executeRawUnsafe(`
        CREATE TABLE "_AircraftTypeToTool" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL
        );
      `)

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX "_AircraftTypeToTool_AB_unique" ON "_AircraftTypeToTool"("A", "B");
      `)

      await prisma.$executeRawUnsafe(`
        CREATE INDEX "_AircraftTypeToTool_B_index" ON "_AircraftTypeToTool"("B");
      `)

      // Add foreign key constraints
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "_AircraftTypeToTool" 
        ADD CONSTRAINT "_AircraftTypeToTool_A_fkey" 
        FOREIGN KEY ("A") REFERENCES "AircraftType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `)

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "_AircraftTypeToTool" 
        ADD CONSTRAINT "_AircraftTypeToTool_B_fkey" 
        FOREIGN KEY ("B") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `)

      console.log("✅ _AircraftTypeToTool table created")
    } else {
      console.log("✅ _AircraftTypeToTool table already exists")
    }

    // Create _AircraftTypeToMaterial table if it doesn't exist
    if (!existingTables.some((t) => t.table_name === "_AircraftTypeToMaterial")) {
      console.log("Creating _AircraftTypeToMaterial table...")

      await prisma.$executeRawUnsafe(`
        CREATE TABLE "_AircraftTypeToMaterial" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL
        );
      `)

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX "_AircraftTypeToMaterial_AB_unique" ON "_AircraftTypeToMaterial"("A", "B");
      `)

      await prisma.$executeRawUnsafe(`
        CREATE INDEX "_AircraftTypeToMaterial_B_index" ON "_AircraftTypeToMaterial"("B");
      `)

      // Add foreign key constraints
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "_AircraftTypeToMaterial" 
        ADD CONSTRAINT "_AircraftTypeToMaterial_A_fkey" 
        FOREIGN KEY ("A") REFERENCES "AircraftType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `)

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "_AircraftTypeToMaterial" 
        ADD CONSTRAINT "_AircraftTypeToMaterial_B_fkey" 
        FOREIGN KEY ("B") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `)

      console.log("✅ _AircraftTypeToMaterial table created")
    } else {
      console.log("✅ _AircraftTypeToMaterial table already exists")
    }

    // Verify tables were created
    const verifyTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('_AircraftTypeToTool', '_AircraftTypeToMaterial');
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
            INSERT INTO "_AircraftTypeToTool" ("A", "B")
            VALUES ('${randomAircraftType.id}', '${tool.id}')
            ON CONFLICT DO NOTHING;
          `)
        }

        // Do the same for materials
        const materials = await prisma.material.findMany({ take: 5 })

        if (materials.length > 0) {
          for (const material of materials) {
            const randomAircraftType = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)]

            await prisma.$executeRawUnsafe(`
              INSERT INTO "_AircraftTypeToMaterial" ("A", "B")
              VALUES ('${randomAircraftType.id}', '${material.id}')
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
