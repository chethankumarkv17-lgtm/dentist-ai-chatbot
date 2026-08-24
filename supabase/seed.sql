-- DEVELOPMENT SEED DATA
-- DO NOT USE IN PRODUCTION

-- Note: In a real system, profiles would be linked to auth.users.
-- Since we are seeding, we create dummy IDs that we would use for testing.

DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    profile_id UUID := '22222222-2222-2222-2222-222222222222';
    clinic_id UUID := '33333333-3333-3333-3333-333333333333';
    dentist_id UUID := '44444444-4444-4444-4444-444444444444';
    service_id UUID := '55555555-5555-5555-5555-555555555555';
    patient_id UUID := '66666666-6666-6666-6666-666666666666';
BEGIN

    INSERT INTO organizations (id, name) VALUES (org_id, 'Smile Clinic Group');

    INSERT INTO profiles (id, email, first_name, last_name) 
    VALUES (profile_id, 'admin@smileclinic.test', 'Alice', 'Admin');

    INSERT INTO organization_members (organization_id, user_id, role) 
    VALUES (org_id, profile_id, 'owner');

    INSERT INTO clinics (id, organization_id, name, timezone, address, phone, email) 
    VALUES (clinic_id, org_id, 'Downtown Smile', 'America/New_York', '123 Main St', '555-0100', 'hello@downtownsmile.test');

    INSERT INTO dentists (id, clinic_id, name, specialty, bio)
    VALUES (dentist_id, clinic_id, 'Dr. Bob Smith', 'General Dentistry', '10 years of experience.');

    INSERT INTO services (id, clinic_id, name, duration_minutes, price, description)
    VALUES (service_id, clinic_id, 'Regular Checkup', 30, 100.00, 'Standard teeth cleaning and checkup.');

    -- Availability: Mon-Fri 9AM to 5PM
    INSERT INTO business_hours (clinic_id, day_of_week, open_time, close_time) VALUES
    (clinic_id, 1, '09:00', '17:00'),
    (clinic_id, 2, '09:00', '17:00'),
    (clinic_id, 3, '09:00', '17:00'),
    (clinic_id, 4, '09:00', '17:00'),
    (clinic_id, 5, '09:00', '17:00');

    INSERT INTO dentist_availability (dentist_id, day_of_week, start_time, end_time) VALUES
    (dentist_id, 1, '09:00', '17:00'),
    (dentist_id, 2, '09:00', '17:00'),
    (dentist_id, 3, '09:00', '17:00'),
    (dentist_id, 4, '09:00', '17:00'),
    (dentist_id, 5, '09:00', '17:00');

    INSERT INTO patients (id, organization_id, first_name, last_name, email, phone)
    VALUES (patient_id, org_id, 'Charlie', 'Patient', 'charlie@example.test', '555-0200');

    INSERT INTO chatbot_settings (clinic_id, prompt_override, theme_color)
    VALUES (clinic_id, 'You are a helpful dental receptionist for Downtown Smile.', '#007BFF');

    INSERT INTO clinic_faqs (clinic_id, question, answer)
    VALUES (clinic_id, 'Do you take insurance?', 'Yes, we accept most major insurance plans.');

END $$;
