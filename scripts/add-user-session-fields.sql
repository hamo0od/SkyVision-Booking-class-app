-- Add tokenVersion and passwordUpdatedAt fields to User table
-- This enables session invalidation when passwords are changed

ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "passwordUpdatedAt" TIMESTAMP(3);

-- Update existing users to have default values
UPDATE "User" 
SET "tokenVersion" = 0, "passwordUpdatedAt" = NOW() 
WHERE "tokenVersion" IS NULL OR "passwordUpdatedAt" IS NULL;

-- Make tokenVersion NOT NULL with default
ALTER TABLE "User" 
ALTER COLUMN "tokenVersion" SET NOT NULL,
ALTER COLUMN "tokenVersion" SET DEFAULT 0;
