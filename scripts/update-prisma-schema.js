const fs = require("fs")
const path = require("path")

async function main() {
  console.log("🔄 Updating Prisma schema...")

  try {
    // Path to your schema.prisma file
    const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma")

    // Read the current schema
    const schema = fs.readFileSync(schemaPath, "utf8")

    // Add enum definitions
    const enumDefinitions = `
enum UserRole {
  ADMIN
  STOREKEEPER
  TECHNICIAN
}

enum MaterialStatus {
  ACTIVE
  INACTIVE
  EXPIRED
}

enum ToolStatus {
  AVAILABLE
  CHECKED_OUT
  OVERDUE
  PENDING_RETURN
  MAINTENANCE
  CALIBRATION
  RETIRED
}

enum CheckoutStatus {
  PENDING
  CHECKED_OUT
  OVERDUE
  PENDING_RETURN
  RETURNED
  LOST
  DAMAGED
}

enum CheckoutPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum CategoryType {
  GENERAL
  MATERIAL
  TOOL
  CONSUMABLE
}

enum LocationType {
  WAREHOUSE
  TOOL_CRIB
  MAINTENANCE_AREA
  LINE_STATION
}

enum RequestPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum RequestStatus {
  PENDING
  APPROVED
  ISSUED
  COMPLETED
  REJECTED
}

enum MovementType {
  ISSUE
  RETURN
  PURCHASE
  ADJUSTMENT
  CHECKOUT
  CHECKIN
}
`

    // Update model definitions to use enums
    const updatedSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_URL")
}

${enumDefinitions}

model User {
  id                String             @id @default(uuid())
  email             String             @unique
  name              String
  password          String
  role              UserRole
  department        String?
  employeeId        String             @unique
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @default(now()) @updatedAt
  materialsCreated  Material[]         @relation("MaterialCreatedBy")
  materialsUpdated  Material[]         @relation("MaterialUpdatedBy")
  toolsCreated      Tool[]             @relation("ToolCreatedBy")
  toolsUpdated      Tool[]             @relation("ToolUpdatedBy")
  checkouts         ItemCheckout[]     @relation("UserCheckouts")
  issuedCheckouts   ItemCheckout[]     @relation("IssuedBy")
  returnedCheckouts ItemCheckout[]     @relation("ReturnedBy")
  materialRequests  MaterialRequest[]  @relation("Requester")
  approvedRequests  MaterialRequest[]  @relation("ApprovedBy")
  issuedRequests    MaterialRequest[]  @relation("IssuedBy")
  stockMovements    StockMovement[]    @relation("PerformedBy")
  notifications     Notification[]
}

model Category {
  id          String       @id @default(uuid())
  name        String       @unique
  description String?
  type        CategoryType @default(GENERAL)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @default(now()) @updatedAt
  materials   Material[]
  tools       Tool[]
}

model Location {
  id          String       @id @default(uuid())
  name        String       @unique
  description String?
  type        LocationType @default(WAREHOUSE)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @default(now()) @updatedAt
  materials   Material[]
  tools       Tool[]
}

model AircraftType {
  id          String     @id @default(uuid())
  name        String     @unique
  description String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @default(now()) @updatedAt
  materials   Material[]
  tools       Tool[]
}

model Material {
  id           String          @id @default(uuid())
  partNumber   String          @unique
  serialNumber String?
  name         String
  description  String?
  category     Category        @relation(fields: [categoryId], references: [id])
  categoryId   String
  location     Location        @relation(fields: [locationId], references: [id])
  locationId   String
  stockQty     Int             @default(0)
  unit         String
  minimumLevel Int             @default(0)
  status       MaterialStatus  @default(ACTIVE)
  isConsumable Boolean         @default(true)
  lastUpdated  DateTime        @default(now())
  createdAt    DateTime        @default(now())
  createdBy    User            @relation("MaterialCreatedBy", fields: [createdById], references: [id])
  createdById  String
  updatedBy    User            @relation("MaterialUpdatedBy", fields: [updatedById], references: [id])
  updatedById  String
  aircraftTypes AircraftType[]
  checkouts    ItemCheckout[]
  requests     MaterialRequest[]
  movements    StockMovement[]

  @@index([stockQty])
}

model Tool {
  id                  String        @id @default(uuid())
  partNumber          String        @unique
  serialNumber        String        @unique
  name                String
  description         String?
  category            Category      @relation(fields: [categoryId], references: [id])
  categoryId          String
  location            Location      @relation(fields: [locationId], references: [id])
  locationId          String
  status              ToolStatus    @default(AVAILABLE)
  maxCheckoutDays     Int           @default(7)
  requiresCalibration Boolean       @default(false)
  lastMaintenanceDate DateTime?
  nextMaintenanceDate DateTime?
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @default(now()) @updatedAt
  createdBy           User          @relation("ToolCreatedBy", fields: [createdById], references: [id])
  createdById         String
  updatedBy           User          @relation("ToolUpdatedBy", fields: [updatedById], references: [id])
  updatedById         String
  aircraftTypes       AircraftType[]
  checkouts           ItemCheckout[]

  @@index([status])
}

model ItemCheckout {
  id                String           @id @default(uuid())
  checkoutNumber    String           @unique
  material          Material?        @relation(fields: [materialId], references: [id])
  materialId        String?
  tool              Tool?            @relation(fields: [toolId], references: [id])
  toolId            String?
  user              User             @relation("UserCheckouts", fields: [userId], references: [id])
  userId            String
  quantity          Int              @default(1)
  purpose           String
  checkoutDate      DateTime         @default(now())
  expectedReturnDate DateTime?
  actualReturnDate  DateTime?
  status            CheckoutStatus   @default(CHECKED_OUT)
  priority          CheckoutPriority @default(NORMAL)
  issuedBy          User?            @relation("IssuedBy", fields: [issuedById], references: [id])
  issuedById        String?
  issuedDate        DateTime?
  returnedBy        User?            @relation("ReturnedBy", fields: [returnedById], references: [id])
  returnedById      String?
  returnedDate      DateTime?
  notes             String?
  returnNotes       String?
  condition         String?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @default(now()) @updatedAt

  @@map("item_checkouts")
  @@index([materialId])
  @@index([toolId])
  @@index([userId])
  @@index([status])
  @@index([checkoutDate])
  @@index([expectedReturnDate])
}

model MaterialRequest {
  id                String          @id @default(uuid())
  requestNumber     String          @unique
  requester         User            @relation("Requester", fields: [requesterId], references: [id])
  requesterId       String
  material          Material        @relation(fields: [materialId], references: [id])
  materialId        String
  quantityRequested Int
  quantityIssued    Int?
  purpose           String
  priority          RequestPriority
  status            RequestStatus   @default(PENDING)
  requestDate       DateTime        @default(now())
  approvedDate      DateTime?
  approvedBy        User?           @relation("ApprovedBy", fields: [approvedById], references: [id])
  approvedById      String?
  issuedDate        DateTime?
  issuedBy          User?           @relation("IssuedBy", fields: [issuedById], references: [id])
  issuedById        String?
  returnDate        DateTime?
  notes             String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @default(now()) @updatedAt
  stockMovements    StockMovement[]
}

model StockMovement {
  id            String       @id @default(uuid())
  material      Material     @relation(fields: [materialId], references: [id])
  materialId    String
  type          MovementType
  quantity      Int
  previousStock Int
  newStock      Int
  request       MaterialRequest? @relation(fields: [requestId], references: [id])
  requestId     String?
  performedBy   User         @relation("PerformedBy", fields: [performedById], references: [id])
  performedById String
  performedAt   DateTime     @default(now())
  notes         String?
  createdAt     DateTime     @default(now())
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  action    String
  entityType String
  entityId  String
  oldValues Json?
  newValues Json?
  timestamp DateTime @default(now())
  ipAddress String?
  userAgent String?
}

model Notification {
  id        String   @id @default(uuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  title     String
  message   String
  type      String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  readAt    DateTime?
}`

    // Write the updated schema
    fs.writeFileSync(schemaPath, updatedSchema)

    console.log("✅ Prisma schema updated successfully")
    console.log("📋 Next steps:")
    console.log('   1. Run "npx prisma generate" to update the Prisma client')
    console.log("   2. Restart your development server")
  } catch (error) {
    console.error("❌ Failed to update Prisma schema:", error)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
