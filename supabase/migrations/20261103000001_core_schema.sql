-- ==============================================================================
-- MediSeba V3 Migration 1: Core Schema & Constraints
-- ==============================================================================

-- 1. Helper Function: Update updated_at Timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
    full_name TEXT NOT NULL,
    phone TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'bn' CHECK (preferred_language IN ('bn', 'en')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Facilities Table
CREATE TABLE public.facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('hospital', 'clinic', 'diagnostic_center', 'telehealth_center')),
    district TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_facilities_updated_at
    BEFORE UPDATE ON public.facilities
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Doctors Table
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    bmdc_number TEXT UNIQUE,
    specialty TEXT NOT NULL,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
    bio TEXT,
    consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (consultation_fee >= 0),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_doctors_updated_at
    BEFORE UPDATE ON public.doctors
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Patients Table
CREATE TABLE public.patients (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_code TEXT UNIQUE NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    address_district TEXT,
    allergies TEXT,
    chronic_conditions TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Doctor Schedules Table
CREATE TABLE public.doctor_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    weekday TEXT NOT NULL CHECK (weekday IN ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_minutes INTEGER NOT NULL DEFAULT 15 CHECK (slot_minutes > 0),
    max_patients INTEGER NOT NULL DEFAULT 20 CHECK (max_patients > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_schedule_time CHECK (end_time > start_time)
);

CREATE TRIGGER trg_doctor_schedules_updated_at
    BEFORE UPDATE ON public.doctor_schedules
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Appointments Table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    token_number INTEGER NOT NULL CHECK (token_number > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Encounters Table
CREATE TABLE public.encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    visit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    chief_complaint TEXT NOT NULL,
    notes TEXT,
    diagnosis_text TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_encounters_updated_at
    BEFORE UPDATE ON public.encounters
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. Prescriptions Table
CREATE TABLE public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID REFERENCES public.encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    advice TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_prescriptions_updated_at
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. Lab Reports Table
CREATE TABLE public.lab_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES public.encounters(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Consents Table
CREATE TABLE public.consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    scope TEXT[] NOT NULL CHECK (cardinality(scope) > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    token_hash TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- 12. Record Access Logs Table (Append-Only)
CREATE TABLE public.record_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    accessor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    allowed BOOLEAN NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Referrals Table
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    from_doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    to_facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
    to_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
    consent_id UUID REFERENCES public.consents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES for Performance & Query Optimization
-- ==============================================================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_doctors_specialty ON public.doctors(specialty);
CREATE INDEX idx_doctors_verified ON public.doctors(is_verified);
CREATE INDEX idx_doctors_facility ON public.doctors(facility_id);
CREATE INDEX idx_patients_code ON public.patients(patient_code);
CREATE INDEX idx_doctor_schedules_doctor ON public.doctor_schedules(doctor_id);
CREATE INDEX idx_doctor_schedules_weekday ON public.doctor_schedules(weekday);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_date ON public.appointments(scheduled_at);
CREATE INDEX idx_encounters_patient ON public.encounters(patient_id);
CREATE INDEX idx_encounters_doctor ON public.encounters(doctor_id);
CREATE INDEX idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON public.prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_encounter ON public.prescriptions(encounter_id);
CREATE INDEX idx_lab_reports_patient ON public.lab_reports(patient_id);
CREATE INDEX idx_consents_patient ON public.consents(patient_id);
CREATE INDEX idx_consents_doctor ON public.consents(doctor_id);
CREATE INDEX idx_consents_expires ON public.consents(expires_at);
CREATE INDEX idx_consents_status ON public.consents(status);
CREATE INDEX idx_access_logs_patient ON public.record_access_logs(patient_id);
CREATE INDEX idx_referrals_patient ON public.referrals(patient_id);
CREATE INDEX idx_referrals_from_doctor ON public.referrals(from_doctor_id);
CREATE INDEX idx_referrals_to_doctor ON public.referrals(to_doctor_id);

-- ==============================================================================
-- TRIGGERS: Security & Business Rule Enforcement
-- ==============================================================================

-- 1. Trigger: On auth.users insert -> auto-create profile with role 'patient'
-- Role NEVER comes from client metadata. Defaults to 'patient'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_full_name TEXT;
    v_patient_code TEXT;
BEGIN
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1),
        'MediSeba User'
    );

    -- Create Profile with STRICT 'patient' default
    INSERT INTO public.profiles (id, role, full_name, phone, preferred_language)
    VALUES (NEW.id, 'patient', v_full_name, NEW.phone, 'bn');

    -- Auto-generate patient record with unique patient_code (MS-XXXXXX)
    v_patient_code := 'MS-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 6));
    
    INSERT INTO public.patients (id, patient_code)
    VALUES (NEW.id, v_patient_code)
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Trigger: Block role mutation on profiles (Prevent privilege escalation)
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        -- Allow only service_role or admin to change roles
        IF (SELECT COALESCE(current_setting('request.jwt.claim.role', true), '')) <> 'service_role' THEN
            -- Check if current authenticated user is admin
            IF NOT EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            ) THEN
                RAISE EXCEPTION 'Unauthorized: Users cannot change their own or other roles.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_profile_role
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- 3. Trigger: Prevent doctor self-verification or unauthorized verification
CREATE OR REPLACE FUNCTION public.protect_doctor_verification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- On INSERT: Always enforce is_verified = false unless service_role or admin
    IF TG_OP = 'INSERT' THEN
        IF (SELECT COALESCE(current_setting('request.jwt.claim.role', true), '')) <> 'service_role' THEN
            IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
                NEW.is_verified := false;
                NEW.verified_at := NULL;
                NEW.verified_by := NULL;
            END IF;
        END IF;
    END IF;

    -- On UPDATE: Changing is_verified, verified_at, verified_by is restricted to admin or service_role
    IF TG_OP = 'UPDATE' THEN
        IF (OLD.is_verified IS DISTINCT FROM NEW.is_verified OR
            OLD.verified_at IS DISTINCT FROM NEW.verified_at OR
            OLD.verified_by IS DISTINCT FROM NEW.verified_by) THEN
            
            IF (SELECT COALESCE(current_setting('request.jwt.claim.role', true), '')) <> 'service_role' THEN
                IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
                    RAISE EXCEPTION 'Unauthorized: Only administrators can verify doctor profiles.';
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_doctor_verification
    BEFORE INSERT OR UPDATE OF is_verified, verified_at, verified_by ON public.doctors
    FOR EACH ROW EXECUTE FUNCTION public.protect_doctor_verification();
