-- Reset users table by deleting all users and their related data
-- Delete bookings first to avoid foreign key constraint issues
DELETE FROM "Booking" WHERE "userId" IS NOT NULL;

-- Delete all users
DELETE FROM "User";

-- Reset auto-increment sequences if using PostgreSQL
-- ALTER SEQUENCE "User_id_seq" RESTART WITH 1;
-- ALTER SEQUENCE "Booking_id_seq" RESTART WITH 1;

-- Verify deletion
SELECT COUNT(*) as remaining_users FROM "User";
SELECT COUNT(*) as remaining_bookings FROM "Booking";
