-- PHASE 34 — PERFORMANCE INDEXES & QUERY OPTIMIZATION

-- 1. Appointments & Availability Indexes (Eliminates full table scans during slot lookups)
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_start 
  ON appointments (clinic_id, start_time, status);

CREATE INDEX IF NOT EXISTS idx_appointments_dentist_time 
  ON appointments (dentist_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_lookup 
  ON appointments (patient_email, patient_phone);

-- 2. Services & Dentists Catalog Indexes
CREATE INDEX IF NOT EXISTS idx_services_clinic_active 
  ON services (clinic_id, is_active, is_bookable);

CREATE INDEX IF NOT EXISTS idx_dentists_clinic_active 
  ON dentists (clinic_id, is_active);

-- 3. Working Hours & Shifts Indexes
CREATE INDEX IF NOT EXISTS idx_business_hours_clinic_day 
  ON business_hours (clinic_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_dentist_avail_dentist_day 
  ON dentist_availability (dentist_id, day_of_week);

-- 4. Conversations & Real-time Chat Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_clinic_created 
  ON conversations (clinic_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created 
  ON messages (conversation_id, created_at ASC);

-- 5. Analytics & System Monitoring Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_clinic_type 
  ON analytics_events (clinic_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time 
  ON system_metrics (metric_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_system_error_logs_sev_time 
  ON system_error_logs (severity, created_at DESC);
