const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  console.log("🔄 Creating enum types in the database...")

  try {
    // Create ToolStatus enum type
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'toolstatus') THEN
          CREATE TYPE "ToolStatus" AS ENUM (
            'AVAILABLE',
            'CHECKED_OUT',
            'OVERDUE',
            'PENDING_RETURN',
            'MAINTENANCE',
            'CALIBRATION',
            'RETIRED'
          );
        END IF;
      END
      $$;
    `
    console.log("✅ Created ToolStatus enum type")

    // Create CheckoutStatus enum type
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checkoutstatus') THEN
          CREATE TYPE "CheckoutStatus" AS ENUM (
            'PENDING',
            'CHECKED_OUT',
            'OVERDUE',
            'PENDING_RETURN',
            'RETURNED',
            'LOST',
            'DAMAGED'
          );
        END IF;
      END
      $$;
    `
    console.log("✅ Created CheckoutStatus enum type")

    // Create other enum types
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checkoutpriority') THEN
          CREATE TYPE "CheckoutPriority" AS ENUM (
            'LOW',
            'NORMAL',
            'HIGH',
            'URGENT'
          );
        END IF;
      END
      $$;
    `
    console.log("✅ Created CheckoutPriority enum type")

    console.log("🎉 All enum types created successfully!")
  } catch (error) {
    console.error("❌ Error creating enum types:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
