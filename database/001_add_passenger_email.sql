-- Run once on an existing PostgreSQL database if passengers.email is missing.
-- Safe to repeat because IF NOT EXISTS is used.
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS email VARCHAR(150);
