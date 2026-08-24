-- Phase 13 Schema Updates

-- Services
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_bookable BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_time_minutes INT DEFAULT 0 CHECK (buffer_time_minutes >= 0);

-- Dentists
ALTER TABLE dentists ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Staff
ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
