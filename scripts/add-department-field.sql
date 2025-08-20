-- Add department field to existing bookings table
ALTER TABLE "Booking" ADD COLUMN "department" TEXT;

-- Update existing bookings to have a default department
UPDATE "Booking" SET "department" = 'Meetings' WHERE "department" IS NULL;
