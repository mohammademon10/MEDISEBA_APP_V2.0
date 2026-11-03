-- ==============================================================================
-- MediSeba V3 Migration 4: Storage Bucket Configuration & Explicit Table Grants
-- ==============================================================================

-- 1. Storage Bucket Configuration: lab-reports (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'lab-reports',
    'lab-reports',
    false,
    20971520, -- 20 MB max limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies (Storage path convention: {patient_id}/{filename})
CREATE POLICY "lab_reports_storage_read"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'lab-reports' AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.has_active_consent((storage.foldername(name))[1]::uuid, 'labs')
            OR public.current_role() = 'admin'
        )
    );

CREATE POLICY "lab_reports_storage_write"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'lab-reports' AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.current_role() = 'doctor'
            OR public.current_role() = 'admin'
        )
    );

-- ==============================================================================
-- 3. Explicit Privilege Grants & Hardening
-- ==============================================================================

-- Revoke default public access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant Function Execution
GRANT EXECUTE ON FUNCTION public.current_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_active_consent(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_record_access(UUID, TEXT, TEXT, UUID, BOOLEAN, TEXT) TO authenticated, service_role;

-- Anonymous (Public) Role Privileges:
-- Can only view public verified doctor profiles, facilities, and public schedule slots
GRANT SELECT ON public.public_doctors TO anon;
GRANT SELECT ON public.facilities TO anon;
GRANT SELECT ON public.doctor_schedules TO anon;

-- Authenticated Role Privileges (Restricted by Row Level Security):
GRANT SELECT ON public.public_doctors TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.facilities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.doctors TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.encounters TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.prescriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lab_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.consents TO authenticated;
-- Note: record_access_logs is strictly INSERT and SELECT only (no UPDATE or DELETE)
GRANT SELECT, INSERT ON public.record_access_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.referrals TO authenticated;

-- Service Role (Full administrative access for background jobs & maintenance)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
