const { execSync } = require("child_process")
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

async function resetAndMigrate() {
  console.log("🔄 Starting Prisma reset and migration...")

  try {
    // Step 1: Reset the database
    console.log("🗑️ Resetting database...")
    execSync("npx prisma migrate reset --force", { stdio: "inherit" })

    // Step 2: Push the schema to create tables
    console.log("🏗️ Pushing schema to database...")
    execSync("npx prisma db push", { stdio: "inherit" })

    // Step 3: Generate Prisma client
    console.log("⚙️ Generating Prisma client...")
    execSync("npx prisma generate", { stdio: "inherit" })

    // Step 4: Seed the database
    console.log("🌱 Seeding database...")
    const prisma = new PrismaClient()

    // Create admin user
    const hashedPassword = await bcrypt.hash("password123", 10)

    await prisma.user.createMany({
      data: [
        {
          id: "admin-user-id",
          email: "admin@airline.com",
          name: "System Admin",
          password: hashedPassword,
          role: "ADMIN",
          department: "IT",
          employeeId: "EMP001",
        },
        {
          id: "storekeeper-id",
          email: "storekeeper@airline.com",
          name: "John Smith",
          password: hashedPassword,
          role: "STOREKEEPER",
          department: "Warehouse",
          employeeId: "EMP002",
        },
        {
          id: "tech-user-id",
          email: "technician@airline.com",
          name: "Mike Johnson",
          password: hashedPassword,
          role: "TECHNICIAN",
          department: "Maintenance",
          employeeId: "EMP003",
        },
      ],
    })

    // Create categories
    await prisma.category.createMany({
      data: [
        { id: "cat-1", name: "Engine Parts", description: "Aircraft engine components" },
        { id: "cat-2", name: "Hydraulic Systems", description: "Hydraulic system components" },
        { id: "cat-3", name: "Electrical", description: "Electrical components and wiring" },
        { id: "cat-4", name: "Hand Tools", description: "Manual tools for maintenance" },
        { id: "cat-5", name: "Power Tools", description: "Electric and pneumatic tools" },
      ],
    })

    // Create locations
    await prisma.location.createMany({
      data: [
        { id: "loc-1", name: "Main Warehouse", description: "Primary storage facility" },
        { id: "loc-2", name: "Tool Crib A", description: "Tool storage area A" },
        { id: "loc-3", name: "Line Maintenance", description: "Line maintenance storage" },
      ],
    })

    // Create aircraft types
    await prisma.aircraftType.createMany({
      data: [
        { id: "ac-1", name: "Boeing 737", description: "Boeing 737 series aircraft" },
        { id: "ac-2", name: "Airbus A320", description: "Airbus A320 family" },
        { id: "ac-3", name: "All Aircraft", description: "Universal components" },
      ],
    })

    // Create materials
    await prisma.material.createMany({
      data: [
        {
          id: "mat-1",
          partNumber: "HYD-001",
          name: "Hydraulic Seal",
          description: "O-ring seal for hydraulic systems",
          categoryId: "cat-2",
          locationId: "loc-1",
          stockQty: 50,
          unit: "Each",
          minimumLevel: 10,
          createdById: "admin-user-id",
          updatedById: "admin-user-id",
        },
        {
          id: "mat-2",
          partNumber: "ENG-002",
          name: "Fuel Injector",
          description: "Engine fuel injector assembly",
          categoryId: "cat-1",
          locationId: "loc-1",
          stockQty: 8,
          unit: "Each",
          minimumLevel: 2,
          createdById: "admin-user-id",
          updatedById: "admin-user-id",
        },
      ],
    })

    // Create tools
    await prisma.tool.createMany({
      data: [
        {
          id: "tool-1",
          partNumber: "TRQ-001",
          serialNumber: "TRQ123456",
          name: "Torque Wrench 50-250 Nm",
          description: "Precision torque wrench",
          categoryId: "cat-4",
          locationId: "loc-2",
          createdById: "admin-user-id",
          updatedById: "admin-user-id",
        },
        {
          id: "tool-2",
          partNumber: "DRL-002",
          serialNumber: "DRL789012",
          name: "Pneumatic Drill Kit",
          description: "Complete pneumatic drill set",
          categoryId: "cat-5",
          locationId: "loc-2",
          createdById: "admin-user-id",
          updatedById: "admin-user-id",
        },
      ],
    })

    await prisma.$disconnect()

    console.log("✅ Database reset and migration complete!")
    console.log("📋 Next steps:")
    console.log("   1. Restart your development server")
    console.log("   2. Login with: admin@airline.com / password123")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

resetAndMigrate()
