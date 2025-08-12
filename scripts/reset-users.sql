-- First delete all bookings (foreign key constraint)
DELETE FROM "Booking";

-- Then delete all users
DELETE FROM "User";

-- Reset auto-increment sequences if using PostgreSQL
-- ALTER SEQUENCE "User_id_seq" RESTART WITH 1;
-- ALTER SEQUENCE "Booking_id_seq" RESTART WITH 1;

-- For SQLite, sequences reset automatically
