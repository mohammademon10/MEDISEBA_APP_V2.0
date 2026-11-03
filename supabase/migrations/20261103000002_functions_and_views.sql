-- ==============================================================================
-- MediSeba V3 Migration 2: Security Helper Functions & Public Views
-- ==============================================================================

-- 1. Helper Function: Get current authenticated user's role
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS TEXT
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
    v_role TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN v_role;
END;
$$ LANGUAGE plpgsql;

-- 2. Helper Function: Check if the calling doctor has active consent
CREATE OR REPLACE FUNCTION public.has_active_consent(p_patient UUID, p_scope TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
    v_caller UUID;
    v_has_consent BOOLEAN;
BEGIN
    v_caller := auth.uid();
    IF v_caller IS NULL OR p_patient IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Calling user must have doctor role (or admin)
    IF (SELECT role FROM public.profiles WHERE id = v_caller) NOT IN ('doctor', 'admin') THEN
        RETURN FALSE;
    END IF;

    -- Check active, unexpired consent containing the requested scope
    SELECT EXISTS (
        SELECT 1
        FROM public.consents
        WHERE patient_id = p_patient
          AND (doctor_id = v_caller OR doctor_id IS NULL)
          AND status = 'active'
          AND expires_at > NOW()
          AND p_scope = ANY(scope)
    ) INTO v_has_consent;

    RETURN v_has_consent;
END;
$$ LANGUAGE plpgsql;

-- 3. Security Definer Function: Log record access (Append-Only)
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
    v_log_id UUID;
BEGIN
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
        auth.uid(),
        p_action,
        p_resource_type,
        p_resource_id,
        p_allowed,
        p_reason
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Secure Public View: Verified Doctors (Publicly Searchable)
-- Allows anonymous and patient users to search verified doctors without exposing private columns
CREATE OR REPLACE VIEW public.public_doctors AS
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
