-- Run this against your database if these columns don't exist yet.
-- Postgres syntax:

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordUpdatedAt" TIMESTAMP WITH TIME ZONE;

-- Optional: backfill passwordUpdatedAt for existing rows
UPDATE "User" SET "passwordUpdatedAt" = NOW() WHERE "passwordUpdatedAt" IS NULL;
