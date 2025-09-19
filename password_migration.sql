-- Password Migration: Convert plain text passwords to bcrypt hashes
-- Run this in Supabase SQL Editor after implementing password hashing

-- Update guest user
UPDATE users SET password_hash = '$2b$12$VOQk5lU2u9xDxx9aXTtnkujJuUbNx8vEiwn1tmLw6Zd1LFJrX4BZi' WHERE id = '2c994aa9-5d67-4c5e-ac6b-2b2af837bf9c';

-- Update bagus.pratomo user
UPDATE users SET password_hash = '$2b$12$CW/HPYovs6V/vehmNKV4FuS8lmwls26ABVBOEKFIsCYwpkDmfdtsy' WHERE id = 'cbfae974-d987-4f09-abe0-b3f1187c99e7';

-- Update safruddin.haeruddin user
UPDATE users SET password_hash = '$2b$12$Hff51Ct7RuyrX5mG3Dd80eyFKwxWj1ejX7iJXiIFc44UpfuwfqGee' WHERE id = 'd77ee567-8a57-403d-9567-60a66d4fe697';

-- Update ardila.firdaus user
UPDATE users SET password_hash = '$2b$12$snhh5MpR4tftbqOm3RykUuakZOcm37ZGBrpsAIi2cZC1kcAtmGwFC' WHERE id = 'db1adc87-20e9-425e-8636-28c695eebe65';

-- Verify migration (optional)
-- SELECT id, username, LEFT(password_hash, 10) || '...' as password_hash_preview FROM users;