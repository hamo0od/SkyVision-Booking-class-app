const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  console.log("🔄 Checking and fixing junction tables...")

  try {
    // Check if the junction tables exist
    let tablesExist = false
    try {
      await prisma.$executeRawUnsafe(`SELECT * FROM "_MaterialToAircraftType" LIMIT 1`)
      await prisma.$executeRawUnsafe(`SELECT * FROM "_ToolToAircraftType" LIMIT 1`)
      tablesExist = true
      console.log("✅ Junction tables already exist")
    } catch (error) {
      console.log("❌ Junction tables are missing, creating them now...")
    }

    if (!tablesExist) {
      // Create the junction tables
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "_MaterialToAircraftType" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL
        )
      `)

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "_ToolToAircraftType" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL
        )
      `)

      // Add constraints and indexes
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "_MaterialToAircraftType_AB_unique" ON "_MaterialToAircraftType"("A", "B")`,
      )
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "_MaterialToAircraftType_B_index" ON "_MaterialToAircraftType"("B")`,
      )
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "_ToolToAircraftType_AB_unique" ON "_ToolToAircraftType"("A", "B")`,
      )
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "_ToolToAircraftType_B_index" ON "_ToolToAircraftType"("B")`,
      )

      // Add foreign key constraints
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "_MaterialToAircraftType" 
        ADD CONSTRAINT "_MaterialToAircraftType_A_fkey" 
        FOREIGN KEY ("A") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `)

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "_MaterialToAircraftType" 
        ADD CONSTRAINT "_MaterialToAircraftType_B_fkey" 
        FOREIGN KEY ("B") REFERENCES "AircraftType"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `)

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "_ToolToAircraftType" 
        ADD CONSTRAINT "_ToolToAircraftType_A_fkey" 
        FOREIGN KEY ("A") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `)

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "_ToolToAircraftType" 
        ADD CONSTRAINT "_ToolToAircraftType_B_fkey" 
        FOREIGN KEY ("B") REFERENCES "AircraftType"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `)

      console.log("✅ Junction tables created successfully")

      // Add sample data
      console.log("🔄 Adding sample relationships...")

      // First check if we have tools and aircraft types
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
            ON CONFLICT DO NOTHING
          `)

          // Some tools get connected to multiple aircraft types
          if (Math.random() > 0.5 && aircraftTypes.length > 1) {
            let secondIndex = Math.floor(Math.random() * aircraftTypes.length)
            // Make sure we don't get the same aircraft type twice
            while (aircraftTypes[secondIndex].id === randomAircraftType.id) {
              secondIndex = Math.floor(Math.random() * aircraftTypes.length)
            }

            await prisma.$executeRawUnsafe(`
              INSERT INTO "_ToolToAircraftType" ("A", "B")
              VALUES ('${tool.id}', '${aircraftTypes[secondIndex].id}')
              ON CONFLICT DO NOTHING
            `)
          }
        }

        // Do the same for materials
        const materials = await prisma.material.findMany({ take: 5 })

        if (materials.length > 0) {
          for (const material of materials) {
            const randomAircraftType = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)]

            await prisma.$executeRawUnsafe(`
              INSERT INTO "_MaterialToAircraftType" ("A", "B")
              VALUES ('${material.id}', '${randomAircraftType.id}')
              ON CONFLICT DO NOTHING
            `)

            if (Math.random() > 0.5 && aircraftTypes.length > 1) {
              let secondIndex = Math.floor(Math.random() * aircraftTypes.length)
              while (aircraftTypes[secondIndex].id === randomAircraftType.id) {
                secondIndex = Math.floor(Math.random() * aircraftTypes.length)
              }

              await prisma.$executeRawUnsafe(`
                INSERT INTO "_MaterialToAircraftType" ("A", "B")
                VALUES ('${material.id}', '${aircraftTypes[secondIndex].id}')
                ON CONFLICT DO NOTHING
              `)
            }
          }
        }

        console.log("✅ Sample relationships added")
      } else {
        console.log("⚠️ No tools or aircraft types found to create relationships")
      }
    }

    console.log("🎉 Junction tables check complete!")
    console.log("📋 Next steps:")
    console.log("   1. Restart your development server")
    console.log("   2. Test the application")
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
