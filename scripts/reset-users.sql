-- Delete all bookings first (due to foreign key constraints)
DELETE FROM "Booking";

-- Delete all users
DELETE FROM "User";

-- Delete all classrooms
DELETE FROM "Classroom";

-- Reset sequences if needed
-- ALTER SEQUENCE "User_id_seq" RESTART WITH 1;
-- ALTER SEQUENCE "Classroom_id_seq" RESTART WITH 1;
-- ALTER SEQUENCE "Booking_id_seq" RESTART WITH 1;
