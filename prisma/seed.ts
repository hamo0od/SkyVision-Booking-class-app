import { PrismaClient, UserRole, MaterialStatus, RequestPriority, RequestStatus } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seeding...")

  // Clean up existing data
  console.log("🧹 Cleaning up existing data...")
  await prisma.stockMovement.deleteMany({})
  await prisma.materialRequest.deleteMany({})
  await prisma.tool.deleteMany({})
  await prisma.material.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.location.deleteMany({})
  await prisma.aircraftType.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.auditLog.deleteMany({})
  await prisma.notification.deleteMany({})

  // Create users
  console.log("👤 Creating users...")
  const adminPassword = await bcrypt.hash("admin123", 10)

  const admin = await prisma.user.create({
    data: {
      email: "admin@airline.com",
      name: "John Admin",
      password: adminPassword,
      role: UserRole.ADMIN,
      employeeId: "ADM001",
    },
  })

  const storekeeper = await prisma.user.create({
    data: {
      email: "storekeeper@airline.com",
      name: "Sarah Store",
      password: adminPassword,
      role: UserRole.STOREKEEPER,
      employeeId: "STK001",
    },
  })

  const technician = await prisma.user.create({
    data: {
      email: "tech@airline.com",
      name: "Mike Tech",
      password: adminPassword,
      role: UserRole.TECHNICIAN,
      department: "Engine Maintenance",
      employeeId: "TCH001",
    },
  })

  // Create categories
  console.log("📁 Creating categories...")
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "Hydraulics", description: "Hydraulic system components" },
    }),
    prisma.category.create({
      data: { name: "Engine", description: "Engine components and parts" },
    }),
    prisma.category.create({
      data: { name: "Avionics", description: "Electronic flight systems" },
    }),
    prisma.category.create({
      data: { name: "Landing Gear", description: "Landing gear components" },
    }),
    prisma.category.create({
      data: { name: "Electrical", description: "Electrical system components" },
    }),
    prisma.category.create({
      data: { name: "Hand Tools", description: "Manual hand tools" },
    }),
    prisma.category.create({
      data: { name: "Power Tools", description: "Electric and pneumatic tools" },
    }),
    prisma.category.create({
      data: { name: "Measuring Tools", description: "Precision measurement tools" },
    }),
  ])

  // Create locations
  console.log("📍 Creating locations...")
  const locations = await Promise.all([
    prisma.location.create({
      data: { name: "A-12-B", description: "Main warehouse section A" },
    }),
    prisma.location.create({
      data: { name: "B-08-C", description: "Main warehouse section B" },
    }),
    prisma.location.create({
      data: { name: "C-05-A", description: "Main warehouse section C" },
    }),
    prisma.location.create({
      data: { name: "Tool Crib A", description: "Tool storage area A" },
    }),
    prisma.location.create({
      data: { name: "Tool Crib B", description: "Tool storage area B" },
    }),
  ])

  // Create aircraft types
  console.log("✈️ Creating aircraft types...")
  const aircraftTypes = await Promise.all([
    prisma.aircraftType.create({
      data: { name: "Boeing 737", description: "Boeing 737 series aircraft" },
    }),
    prisma.aircraftType.create({
      data: { name: "Airbus A320", description: "Airbus A320 family aircraft" },
    }),
    prisma.aircraftType.create({
      data: { name: "Airbus A330", description: "Airbus A330 family aircraft" },
    }),
    prisma.aircraftType.create({
      data: { name: "All Aircraft", description: "Compatible with all aircraft types" },
    }),
  ])

  // Create materials
  console.log("📦 Creating materials...")
  const hydraulicSealKit = await prisma.material.create({
    data: {
      partNumber: "HYD-001",
      serialNumber: "SN123456",
      name: "Hydraulic Seal Kit",
      description: "Complete seal kit for hydraulic actuators",
      categoryId: categories[0].id, // Hydraulics
      locationId: locations[0].id, // A-12-B
      stockQty: 2,
      unit: "Kit",
      minimumLevel: 10,
      status: MaterialStatus.ACTIVE,
      createdById: admin.id,
      updatedById: admin.id,
      aircraftTypes: {
        connect: [
          { id: aircraftTypes[0].id }, // Boeing 737
          { id: aircraftTypes[1].id }, // Airbus A320
        ],
      },
    },
  })

  const engineOilFilter = await prisma.material.create({
    data: {
      partNumber: "ENG-045",
      name: "Engine Oil Filter",
      description: "High-performance engine oil filter",
      categoryId: categories[1].id, // Engine
      locationId: locations[1].id, // B-08-C
      stockQty: 5,
      unit: "Each",
      minimumLevel: 15,
      status: MaterialStatus.ACTIVE,
      createdById: admin.id,
      updatedById: admin.id,
      aircraftTypes: {
        connect: [
          { id: aircraftTypes[0].id }, // Boeing 737
        ],
      },
    },
  })

  const navigationDisplay = await prisma.material.create({
    data: {
      partNumber: "AVN-012",
      serialNumber: "AVN789012",
      name: "Navigation Display Unit",
      description: "Electronic navigation display for cockpit",
      categoryId: categories[2].id, // Avionics
      locationId: locations[2].id, // C-05-A
      stockQty: 25,
      unit: "Each",
      minimumLevel: 5,
      status: MaterialStatus.ACTIVE,
      createdById: admin.id,
      updatedById: admin.id,
      aircraftTypes: {
        connect: [
          { id: aircraftTypes[1].id }, // Airbus A320
          { id: aircraftTypes[2].id }, // Airbus A330
        ],
      },
    },
  })

  // Create tools
  console.log("🔧 Creating tools...")
  const torqueWrench = await prisma.material.create({
    data: {
      partNumber: "TRQ-001",
      serialNumber: "TRQ123456",
      name: "Torque Wrench 50-250 Nm",
      description: "Precision torque wrench for aircraft maintenance",
      categoryId: categories[5].id, // Hand Tools
      locationId: locations[3].id, // Tool Crib A
      stockQty: 3,
      unit: "Each",
      minimumLevel: 2,
      status: MaterialStatus.ACTIVE,
      createdById: admin.id,
      updatedById: admin.id,
      aircraftTypes: {
        connect: [
          { id: aircraftTypes[3].id }, // All Aircraft
        ],
      },
    },
  })

  await prisma.tool.create({
    data: {
      id: torqueWrench.id,
      isReturnable: true,
      calibrationDueDate: new Date("2024-03-15"),
    },
  })

  const pneumaticDrill = await prisma.material.create({
    data: {
      partNumber: "DRL-002",
      serialNumber: "DRL789012",
      name: "Pneumatic Drill Kit",
      description: "Complete pneumatic drill kit with accessories",
      categoryId: categories[6].id, // Power Tools
      locationId: locations[4].id, // Tool Crib B
      stockQty: 1,
      unit: "Kit",
      minimumLevel: 1,
      status: MaterialStatus.ACTIVE,
      createdById: admin.id,
      updatedById: admin.id,
      aircraftTypes: {
        connect: [
          { id: aircraftTypes[0].id }, // Boeing 737
          { id: aircraftTypes[1].id }, // Airbus A320
        ],
      },
    },
  })

  await prisma.tool.create({
    data: {
      id: pneumaticDrill.id,
      isReturnable: true,
      calibrationDueDate: new Date("2024-06-20"),
      currentHolderId: technician.id,
      issuedDate: new Date("2024-01-10"),
    },
  })

  const digitalCaliper = await prisma.material.create({
    data: {
      partNumber: "CAL-003",
      serialNumber: "CAL345678",
      name: "Digital Caliper",
      description: "Precision digital caliper for measurements",
      categoryId: categories[7].id, // Measuring Tools
      locationId: locations[3].id, // Tool Crib A
      stockQty: 0,
      unit: "Each",
      minimumLevel: 2,
      status: MaterialStatus.ACTIVE,
      createdById: admin.id,
      updatedById: admin.id,
      aircraftTypes: {
        connect: [
          { id: aircraftTypes[3].id }, // All Aircraft
        ],
      },
    },
  })

  await prisma.tool.create({
    data: {
      id: digitalCaliper.id,
      isReturnable: true,
      calibrationDueDate: new Date("2024-01-20"),
    },
  })

  // Create material requests
  console.log("📝 Creating material requests...")
  const request1 = await prisma.materialRequest.create({
    data: {
      requestNumber: "REQ001",
      requesterId: technician.id,
      materialId: hydraulicSealKit.id,
      quantityRequested: 5,
      purpose: "Routine maintenance on Boeing 737-800",
      priority: RequestPriority.HIGH,
      status: RequestStatus.PENDING,
      notes: "Urgent repair needed for aircraft AOG situation",
    },
  })

  const request2 = await prisma.materialRequest.create({
    data: {
      requestNumber: "REQ002",
      requesterId: technician.id,
      materialId: navigationDisplay.id,
      quantityRequested: 1,
      quantityIssued: 1,
      purpose: "Replace faulty unit",
      priority: RequestPriority.MEDIUM,
      status: RequestStatus.ISSUED,
      issuedById: storekeeper.id,
      issuedDate: new Date("2024-01-15T09:00:00Z"),
      notes: "Unit tested and verified before installation",
    },
  })

  // Create stock movements
  console.log("📊 Creating stock movements...")
  await prisma.stockMovement.create({
    data: {
      materialId: navigationDisplay.id,
      type: "ISSUE",
      quantity: 1,
      previousStock: 26,
      newStock: 25,
      requestId: request2.id,
      performedById: storekeeper.id,
      notes: "Issued for replacement of faulty unit",
    },
  })

  console.log("✅ Database seeding completed successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
