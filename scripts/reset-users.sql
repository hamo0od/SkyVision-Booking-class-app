-- Reset users table by deleting all users and their related data
-- Delete bookings first to avoid foreign key constraint issues
DELETE FROM "Booking" WHERE "userId" IS NOT NULL;

-- Delete all users
DELETE FROM "User";

-- Verify deletion
SELECT COUNT(*) as remaining_users FROM "User";
SELECT COUNT(*) as remaining_bookings FROM "Booking";
