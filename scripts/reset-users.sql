-- Delete all bookings first (foreign key constraint)
DELETE FROM bookings;

-- Delete all users
DELETE FROM users;

-- Reset sequences if needed
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS bookings_id_seq RESTART WITH 1;
