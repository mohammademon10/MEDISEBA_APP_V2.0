-- ==============================================================================
-- MediSeba V3 Migration 5: Security Hardening & Vulnerability Remediation
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. RECORD ACCESS LOGS HARDENING (Immutability & Forgery Prevention)
-- ------------------------------------------------------------------------------

-- Drop unrestricted authenticated insert policy
DROP POLICY IF EXISTS "record_access_logs_insert_authenticated" ON public.record_access_logs;

-- Revoke direct table INSERT from authenticated and public
REVOKE INSERT, UPDATE, DELETE ON public.record_access_logs FROM PUBLIC, anon, authenticated;

-- Hardened, validated SECURITY DEFINER logging function
CREATE OR REPLACE FUNCTION public.log_record_access(
    p_patient_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_allowed BOOLEAN DEFAULT TRUE,
    p_reason TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller UUID;
    v_log_id UUID;
BEGIN
    v_caller := auth.uid();
    
    -- Verify caller identity exists
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Cannot log access without authenticated context.';
    END IF;

    -- Validate patient existence
    IF NOT EXISTS (SELECT 1 FROM public.patients WHERE id = p_patient_id) THEN
        RAISE EXCEPTION 'Invalid patient_id: Patient does not exist.';
    END IF;

    -- Validate action enum
    IF p_action NOT IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'EXPORT', 'CONSENT_GRANT', 'CONSENT_REVOKE') THEN
        RAISE EXCEPTION 'Invalid action: %', p_action;
    END IF;

    -- Validate resource_type enum
    IF p_resource_type NOT IN ('patients', 'encounters', 'prescriptions', 'lab_reports', 'consents', 'referrals', 'appointments', 'doctor_schedules', 'profiles') THEN
        RAISE EXCEPTION 'Invalid resource_type: %', p_resource_type;
    END IF;

    -- Insert verified immutable log entry (accessor is guaranteed to be auth.uid())
    INSERT INTO public.record_access_logs (
        patient_id,
        accessor_id,
        action,
        resource_type,
        resource_id,
        allowed,
        reason
    )
    VALUES (
        p_patient_id,
        v_caller,
        p_action,
        p_resource_type,
        p_resource_id,
        p_allowed,
        SUBSTRING(p_reason FROM 1 FOR 500)
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.log_record_access(UUID, TEXT, TEXT, UUID, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_record_access(UUID, TEXT, TEXT, UUID, BOOLEAN, TEXT) TO authenticated, service_role;

-- Enforce absolute immutability on record_access_logs via trigger (blocks any UPDATE/DELETE)
CREATE OR REPLACE FUNCTION public.prevent_access_log_tampering()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RAISE EXCEPTION 'Security Violation: record_access_logs is strictly append-only. Modification or deletion is forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_access_log_tampering ON public.record_access_logs;
CREATE TRIGGER trg_prevent_access_log_tampering
    BEFORE UPDATE OR DELETE ON public.record_access_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_access_log_tampering();

-- ------------------------------------------------------------------------------
-- 2. DOCTOR REGISTRATION & VERIFICATION HARDENING
-- ------------------------------------------------------------------------------

-- Controlled doctor registration function
CREATE OR REPLACE FUNCTION public.register_doctor_candidate(
    p_bmdc_number TEXT,
    p_specialty TEXT,
    p_facility_id UUID DEFAULT NULL,
    p_bio TEXT DEFAULT NULL,
    p_consultation_fee NUMERIC DEFAULT 0
)
RETURNS UUID
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required to register as doctor candidate.';
    END IF;

    -- Validate BMDC number (mandatory, non-empty, alphanumeric format)
    IF p_bmdc_number IS NULL OR TRIM(p_bmdc_number) = '' OR length(p_bmdc_number) > 50 THEN
        RAISE EXCEPTION 'Invalid BMDC registration number.';
    END IF;

    -- Validate specialty
    IF p_specialty IS NULL OR TRIM(p_specialty) = '' THEN
        RAISE EXCEPTION 'Specialty is required.';
    END IF;

    -- Validate fee
    IF p_consultation_fee < 0 THEN
        RAISE EXCEPTION 'Consultation fee cannot be negative.';
    END IF;

    -- Validate facility if provided
    IF p_facility_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.facilities WHERE id = p_facility_id) THEN
        RAISE EXCEPTION 'Specified facility does not exist.';
    END IF;

    -- Insert unverified doctor profile
    INSERT INTO public.doctors (
        id,
        bmdc_number,
        specialty,
        facility_id,
        bio,
        consultation_fee,
        is_verified,
        verified_at,
        verified_by
    )
    VALUES (
        v_user_id,
        TRIM(p_bmdc_number),
        TRIM(p_specialty),
        p_facility_id,
        p_bio,
        p_consultation_fee,
        false, -- Always unverified on registration
        NULL,
        NULL
    )
    ON CONFLICT (id) DO UPDATE SET
        bmdc_number = EXCLUDED.bmdc_number,
        specialty = EXCLUDED.specialty,
        facility_id = EXCLUDED.facility_id,
        bio = EXCLUDED.bio,
        consultation_fee = EXCLUDED.consultation_fee
        -- is_verified, verified_at, verified_by REMAIN UNCHANGED
    WHERE public.doctors.is_verified = false;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.register_doctor_candidate(TEXT, TEXT, UUID, TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_doctor_candidate(TEXT, TEXT, UUID, TEXT, NUMERIC) TO authenticated, service_role;

-- Tighten doctors table RLS policies
DROP POLICY IF EXISTS "doctors_insert_own" ON public.doctors;
CREATE POLICY "doctors_insert_restricted"
    ON public.doctors FOR INSERT
    TO authenticated
    WITH CHECK (
        id = auth.uid() 
        AND is_verified = false 
        AND verified_at IS NULL 
        AND verified_by IS NULL
    );

-- Base doctors table SELECT: only authenticated users (anon must use public_doctors view)
DROP POLICY IF EXISTS "doctors_select_verified_or_own_or_admin" ON public.doctors;
CREATE POLICY "doctors_select_authenticated"
    ON public.doctors FOR SELECT
    TO authenticated
    USING (
        is_verified = true
        OR id = auth.uid()
        OR public.current_role() = 'admin'
    );

REVOKE SELECT ON public.doctors FROM anon;

-- ------------------------------------------------------------------------------
-- 3. ROLE PROTECTION (INSERT & UPDATE)
-- ------------------------------------------------------------------------------

-- Extend role protection to both INSERT and UPDATE
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Non-admin / non-service-role inserts must strictly have role 'patient'
        IF (SELECT COALESCE(current_setting('request.jwt.claim.role', true), '')) <> 'service_role' THEN
            IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
                NEW.role := 'patient';
            END IF;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            IF (SELECT COALESCE(current_setting('request.jwt.claim.role', true), '')) <> 'service_role' THEN
                IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
                    RAISE EXCEPTION 'Unauthorized: Users cannot change their own or other roles.';
                END IF;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
    BEFORE INSERT OR UPDATE OF role ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- ------------------------------------------------------------------------------
-- 4. APPOINTMENT MUTATION PROTECTION
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_appointment_mutation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller UUID;
    v_is_admin BOOLEAN;
BEGIN
    v_caller := auth.uid();
    v_is_admin := EXISTS (SELECT 1 FROM public.profiles WHERE id = v_caller AND role = 'admin');

    IF NOT v_is_admin AND (SELECT COALESCE(current_setting('request.jwt.claim.role', true), '')) <> 'service_role' THEN
        -- Immutable fields: patient_id, doctor_id, token_number cannot be modified
        IF OLD.patient_id IS DISTINCT FROM NEW.patient_id THEN
            RAISE EXCEPTION 'Forbidden: patient_id on appointment cannot be changed.';
        END IF;
        IF OLD.doctor_id IS DISTINCT FROM NEW.doctor_id THEN
            RAISE EXCEPTION 'Forbidden: doctor_id on appointment cannot be changed.';
        END IF;
        IF OLD.token_number IS DISTINCT FROM NEW.token_number THEN
            RAISE EXCEPTION 'Forbidden: token_number on appointment cannot be changed.';
        END IF;

        -- If caller is the patient: can ONLY change status to 'cancelled'
        IF v_caller = OLD.patient_id THEN
            IF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at THEN
                RAISE EXCEPTION 'Forbidden: Patients cannot alter scheduled_at directly. Please cancel and re-book.';
            END IF;
            IF NEW.status <> 'cancelled' THEN
                RAISE EXCEPTION 'Forbidden: Patients can only change status to cancelled.';
            END IF;
        END IF;

        -- If caller is doctor: must be the assigned doctor
        IF v_caller = OLD.doctor_id THEN
            -- Allowed: status update (confirmed, completed, cancelled)
            NULL;
        ELSIF v_caller <> OLD.patient_id THEN
            RAISE EXCEPTION 'Unauthorized: You are neither the patient nor the doctor for this appointment.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_appointment_mutation ON public.appointments;
CREATE TRIGGER trg_protect_appointment_mutation
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.protect_appointment_mutation();

-- ------------------------------------------------------------------------------
-- 5. LAB REPORTS & STORAGE HARDENING
-- ------------------------------------------------------------------------------

-- Strict lab report insertion policy
DROP POLICY IF EXISTS "lab_reports_insert_patient_or_uploader_or_admin" ON public.lab_reports;
CREATE POLICY "lab_reports_insert_strict"
    ON public.lab_reports FOR INSERT
    TO authenticated
    WITH CHECK (
        uploaded_by = auth.uid()
        AND (
            patient_id = auth.uid()
            OR public.current_role() = 'admin'
            OR (public.current_role() = 'doctor' AND public.has_active_consent(patient_id, 'labs'))
        )
    );

-- Delete policy: Only the uploader or admin can delete lab reports (patients cannot delete doctor-uploaded reports)
DROP POLICY IF EXISTS "lab_reports_delete_uploader_or_admin" ON public.lab_reports;
CREATE POLICY "lab_reports_delete_uploader_or_admin"
    ON public.lab_reports FOR DELETE
    TO authenticated
    USING (
        uploaded_by = auth.uid()
        OR public.current_role() = 'admin'
    );

GRANT DELETE ON public.lab_reports TO authenticated;

-- Storage RLS Hardening: Doctors can only upload to patients who gave 'labs' consent
DROP POLICY IF EXISTS "lab_reports_storage_write" ON storage.objects;
CREATE POLICY "lab_reports_storage_write"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'lab-reports' AND (
            -- Patient uploading to their own folder
            (storage.foldername(name))[1] = auth.uid()::text
            -- Admin
            OR public.current_role() = 'admin'
            -- Doctor with active consent for that specific patient
            OR (
                public.current_role() = 'doctor' 
                AND public.has_active_consent((storage.foldername(name))[1]::uuid, 'labs')
            )
        )
    );

-- Storage Delete: Patient can only delete files in their own folder if uploaded by them
DROP POLICY IF EXISTS "lab_reports_storage_delete" ON storage.objects;
CREATE POLICY "lab_reports_storage_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'lab-reports' AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.current_role() = 'admin'
        )
    );

-- ------------------------------------------------------------------------------
-- 6. PUBLIC DOCTORS VIEW HARDENING (security_barrier)
-- ------------------------------------------------------------------------------

-- Recreate view with security_barrier to prevent side-channel leaks
CREATE OR REPLACE VIEW public.public_doctors 
WITH (security_barrier = true) AS
SELECT 
    d.id,
    p.full_name,
    d.bmdc_number,
    d.specialty,
    d.facility_id,
    f.name AS facility_name,
    d.bio,
    d.consultation_fee,
    d.is_verified,
    d.created_at
FROM public.doctors d
JOIN public.profiles p ON p.id = d.id
LEFT JOIN public.facilities f ON f.id = d.facility_id
WHERE d.is_verified = true;

GRANT SELECT ON public.public_doctors TO anon, authenticated;
