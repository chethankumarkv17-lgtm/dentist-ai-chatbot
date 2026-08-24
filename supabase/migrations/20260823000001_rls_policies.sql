-- MULTI-TENANCY RLS POLICIES

-- Helper Functions
-- get_user_orgs: Returns a list of organization IDs the current user belongs to.
CREATE OR REPLACE FUNCTION public.get_user_orgs()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$;

-- get_user_role: Returns the user's role for a specific organization.
CREATE OR REPLACE FUNCTION public.get_user_role(org_id uuid)
RETURNS varchar
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT role FROM organization_members WHERE user_id = auth.uid() AND organization_id = org_id;
$$;

-- 1. Organizations
CREATE POLICY "org_select" ON organizations FOR SELECT USING (id IN (SELECT get_user_orgs()));
CREATE POLICY "org_update" ON organizations FOR UPDATE USING (id IN (SELECT get_user_orgs()) AND get_user_role(id) IN ('owner', 'admin'));
-- (No delete for orgs via client, must be done by superadmin)

-- 2. Profiles
CREATE POLICY "profiles_select_self" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE USING (id = auth.uid());
-- Profiles can also be viewed by org admins sharing an org
CREATE POLICY "profiles_select_org" ON profiles FOR SELECT USING (
    id IN (SELECT user_id FROM organization_members WHERE organization_id IN (SELECT get_user_orgs()))
);

-- 3. Organization Members
CREATE POLICY "org_members_select" ON organization_members FOR SELECT USING (organization_id IN (SELECT get_user_orgs()));
CREATE POLICY "org_members_insert" ON organization_members FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_orgs()) AND get_user_role(organization_id) IN ('owner', 'admin'));
CREATE POLICY "org_members_update" ON organization_members FOR UPDATE USING (organization_id IN (SELECT get_user_orgs()) AND get_user_role(organization_id) IN ('owner', 'admin'));
CREATE POLICY "org_members_delete" ON organization_members FOR DELETE USING (organization_id IN (SELECT get_user_orgs()) AND get_user_role(organization_id) IN ('owner', 'admin'));

-- 4. Clinics
CREATE POLICY "clinics_select" ON clinics FOR SELECT USING (organization_id IN (SELECT get_user_orgs()));
CREATE POLICY "clinics_all" ON clinics FOR ALL USING (organization_id IN (SELECT get_user_orgs()) AND get_user_role(organization_id) IN ('owner', 'admin', 'clinic_admin'));

-- Helper for Clinic-Linked Resources
CREATE OR REPLACE FUNCTION public.get_user_clinics()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT id FROM clinics WHERE organization_id IN (SELECT get_user_orgs());
$$;

-- 5. Staff, Dentists, Services, Business Hours, Dentist Availability, Holidays
CREATE POLICY "clinic_resources_select" ON staff FOR SELECT USING (clinic_id IN (SELECT get_user_clinics()));
CREATE POLICY "clinic_resources_all" ON staff FOR ALL USING (clinic_id IN (SELECT get_user_clinics()) AND get_user_role((SELECT organization_id FROM clinics WHERE id = staff.clinic_id)) IN ('owner', 'admin', 'clinic_admin'));

CREATE POLICY "dentists_select" ON dentists FOR SELECT USING (clinic_id IN (SELECT get_user_clinics()));
CREATE POLICY "dentists_all" ON dentists FOR ALL USING (clinic_id IN (SELECT get_user_clinics()));

CREATE POLICY "services_select" ON services FOR SELECT USING (clinic_id IN (SELECT get_user_clinics()));
CREATE POLICY "services_all" ON services FOR ALL USING (clinic_id IN (SELECT get_user_clinics()));

CREATE POLICY "business_hours_select" ON business_hours FOR SELECT USING (clinic_id IN (SELECT get_user_clinics()));
CREATE POLICY "business_hours_all" ON business_hours FOR ALL USING (clinic_id IN (SELECT get_user_clinics()));

CREATE POLICY "dentist_availability_select" ON dentist_availability FOR SELECT USING (dentist_id IN (SELECT id FROM dentists WHERE clinic_id IN (SELECT get_user_clinics())));
CREATE POLICY "dentist_availability_all" ON dentist_availability FOR ALL USING (dentist_id IN (SELECT id FROM dentists WHERE clinic_id IN (SELECT get_user_clinics())));

CREATE POLICY "blocked_times_select" ON blocked_times FOR SELECT USING (dentist_id IN (SELECT id FROM dentists WHERE clinic_id IN (SELECT get_user_clinics())));
CREATE POLICY "blocked_times_all" ON blocked_times FOR ALL USING (dentist_id IN (SELECT id FROM dentists WHERE clinic_id IN (SELECT get_user_clinics())));

CREATE POLICY "holidays_select" ON holidays FOR SELECT USING (clinic_id IN (SELECT get_user_clinics()));
CREATE POLICY "holidays_all" ON holidays FOR ALL USING (clinic_id IN (SELECT get_user_clinics()));

-- 6. Patients
CREATE POLICY "patients_select" ON patients FOR SELECT USING (organization_id IN (SELECT get_user_orgs()));
CREATE POLICY "patients_all" ON patients FOR ALL USING (organization_id IN (SELECT get_user_orgs()));

-- 7. Appointments & Events
CREATE POLICY "appointments_select" ON appointments FOR SELECT USING (clinic_id IN (SELECT get_user_clinics()));
CREATE POLICY "appointments_all" ON appointments FOR ALL USING (clinic_id IN (SELECT get_user_clinics()));

CREATE POLICY "appointment_events_select" ON appointment_events FOR SELECT USING (appointment_id IN (SELECT id FROM appointments WHERE clinic_id IN (SELECT get_user_clinics())));
CREATE POLICY "appointment_events_insert" ON appointment_events FOR INSERT WITH CHECK (appointment_id IN (SELECT id FROM appointments WHERE clinic_id IN (SELECT get_user_clinics())));

-- 8. Chatbot & Faqs
CREATE POLICY "chatbot_settings_select" ON chatbot_settings FOR SELECT USING (clinic_id IN (SELECT get_user_clinics()));
CREATE POLICY "chatbot_settings_all" ON chatbot_settings FOR ALL USING (clinic_id IN (SELECT get_user_clinics()));

CREATE POLICY "clinic_faqs_select" ON clinic_faqs FOR SELECT USING (clinic_id IN (SELECT get_user_clinics()));
CREATE POLICY "clinic_faqs_all" ON clinic_faqs FOR ALL USING (clinic_id IN (SELECT get_user_clinics()));

-- 9. Conversations & Messages
CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (clinic_id IN (SELECT get_user_clinics()));
CREATE POLICY "conversations_all" ON conversations FOR ALL USING (clinic_id IN (SELECT get_user_clinics()));

CREATE POLICY "messages_select" ON messages FOR SELECT USING (conversation_id IN (SELECT id FROM conversations WHERE clinic_id IN (SELECT get_user_clinics())));
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE clinic_id IN (SELECT get_user_clinics())));

-- 10. Web Builder
CREATE POLICY "clinic_websites_select" ON clinic_websites FOR SELECT USING (clinic_id IN (SELECT get_user_clinics()));
CREATE POLICY "clinic_websites_all" ON clinic_websites FOR ALL USING (clinic_id IN (SELECT get_user_clinics()));

CREATE POLICY "website_pages_select" ON website_pages FOR SELECT USING (website_id IN (SELECT id FROM clinic_websites WHERE clinic_id IN (SELECT get_user_clinics())));
CREATE POLICY "website_pages_all" ON website_pages FOR ALL USING (website_id IN (SELECT id FROM clinic_websites WHERE clinic_id IN (SELECT get_user_clinics())));

CREATE POLICY "website_domains_select" ON website_domains FOR SELECT USING (website_id IN (SELECT id FROM clinic_websites WHERE clinic_id IN (SELECT get_user_clinics())));
CREATE POLICY "website_domains_all" ON website_domains FOR ALL USING (website_id IN (SELECT id FROM clinic_websites WHERE clinic_id IN (SELECT get_user_clinics())));

CREATE POLICY "website_installations_select" ON website_installations FOR SELECT USING (clinic_id IN (SELECT get_user_clinics()));
CREATE POLICY "website_installations_all" ON website_installations FOR ALL USING (clinic_id IN (SELECT get_user_clinics()));

-- 11. Billing, Subscriptions, AI Usage
CREATE POLICY "plans_select" ON plans FOR SELECT USING (true); -- Publicly viewable by all authenticated users
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (organization_id IN (SELECT get_user_orgs()));
CREATE POLICY "usage_records_select" ON usage_records FOR SELECT USING (organization_id IN (SELECT get_user_orgs()));
CREATE POLICY "ai_usage_select" ON ai_usage FOR SELECT USING (organization_id IN (SELECT get_user_orgs()));

-- 12. Notifications & Logs
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (organization_id IN (SELECT get_user_orgs()));
CREATE POLICY "notification_events_select" ON notification_events FOR SELECT USING (notification_id IN (SELECT id FROM notifications WHERE organization_id IN (SELECT get_user_orgs())));

CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (organization_id IN (SELECT get_user_orgs()));
-- NO UPDATE, INSERT, DELETE policies for AI Usage and Audit Logs via client. 
-- These are written by the Server/Service Role ONLY.

CREATE POLICY "calendar_connections_select" ON calendar_connections FOR SELECT USING (dentist_id IN (SELECT id FROM dentists WHERE clinic_id IN (SELECT get_user_clinics())));
CREATE POLICY "calendar_connections_all" ON calendar_connections FOR ALL USING (dentist_id IN (SELECT id FROM dentists WHERE clinic_id IN (SELECT get_user_clinics())));
-- Webhooks are strictly server-side, block client access entirely.
CREATE POLICY "webhook_events_none" ON webhook_events FOR SELECT USING (false);
