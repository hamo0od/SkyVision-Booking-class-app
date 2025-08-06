-- AlterTable
ALTER TABLE "tools" DROP COLUMN IF EXISTS "calibrationDueDate",
DROP COLUMN IF EXISTS "currentHolderId",
DROP COLUMN IF EXISTS "issuedDate",
ADD COLUMN "maxCheckoutDays" INTEGER NOT NULL DEFAULT 7;

-- CreateTable
CREATE TABLE "tool_checkouts" (
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
);

-- CreateIndex
CREATE INDEX "tool_checkouts_toolId_idx" ON "tool_checkouts"("toolId");

-- CreateIndex
CREATE INDEX "tool_checkouts_userId_idx" ON "tool_checkouts"("userId");

-- CreateIndex
CREATE INDEX "tool_checkouts_status_idx" ON "tool_checkouts"("status");

-- CreateIndex
CREATE INDEX "tool_checkouts_dueDate_idx" ON "tool_checkouts"("dueDate");

-- AddForeignKey
ALTER TABLE "tool_checkouts" ADD CONSTRAINT "tool_checkouts_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_checkouts" ADD CONSTRAINT "tool_checkouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
