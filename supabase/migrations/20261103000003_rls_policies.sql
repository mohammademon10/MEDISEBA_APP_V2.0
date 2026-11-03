-- ==============================================================================
-- MediSeba V3 Migration 3: Row Level Security (RLS) Policies
-- ==============================================================================

-- 1. Enable RLS on EVERY Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Profiles Policies
-- ==============================================================================
CREATE POLICY "profiles_select_own_or_admin"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.current_role() = 'admin');

CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own_or_admin"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.current_role() = 'admin')
    WITH CHECK (id = auth.uid() OR public.current_role() = 'admin');

-- ==============================================================================
-- 3. Facilities Policies (Public read, admin manage)
-- ==============================================================================
CREATE POLICY "facilities_select_all"
    ON public.facilities FOR SELECT
    TO public
    USING (true);

CREATE POLICY "facilities_admin_insert"
    ON public.facilities FOR INSERT
    TO authenticated
    WITH CHECK (public.current_role() = 'admin');

CREATE POLICY "facilities_admin_update"
    ON public.facilities FOR UPDATE
    TO authenticated
    USING (public.current_role() = 'admin')
    WITH CHECK (public.current_role() = 'admin');

CREATE POLICY "facilities_admin_delete"
    ON public.facilities FOR DELETE
    TO authenticated
    USING (public.current_role() = 'admin');

-- ==============================================================================
-- 4. Doctors Policies
-- ==============================================================================
CREATE POLICY "doctors_select_verified_or_own_or_admin"
    ON public.doctors FOR SELECT
    TO public
    USING (
        is_verified = true
        OR id = auth.uid()
        OR public.current_role() = 'admin'
    );

CREATE POLICY "doctors_insert_own"
    ON public.doctors FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "doctors_update_own_or_admin"
    ON public.doctors FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.current_role() = 'admin')
    WITH CHECK (id = auth.uid() OR public.current_role() = 'admin');

-- ==============================================================================
-- 5. Patients Policies (High Sensitivity)
-- ==============================================================================
CREATE POLICY "patients_select_own_or_consented_or_admin"
    ON public.patients FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR public.current_role() = 'admin'
        OR (public.current_role() = 'doctor' AND public.has_active_consent(id, 'history'))
    );

CREATE POLICY "patients_insert_own"
    ON public.patients FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "patients_update_own_or_admin"
    ON public.patients FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.current_role() = 'admin')
    WITH CHECK (id = auth.uid() OR public.current_role() = 'admin');

-- ==============================================================================
-- 6. Doctor Schedules Policies (Public read, doctor/admin write)
-- ==============================================================================
CREATE POLICY "doctor_schedules_select_all"
    ON public.doctor_schedules FOR SELECT
    TO public
    USING (true);

CREATE POLICY "doctor_schedules_manage_own_or_admin"
    ON public.doctor_schedules FOR ALL
    TO authenticated
    USING (doctor_id = auth.uid() OR public.current_role() = 'admin')
    WITH CHECK (doctor_id = auth.uid() OR public.current_role() = 'admin');

-- ==============================================================================
-- 7. Appointments Policies
-- ==============================================================================
CREATE POLICY "appointments_select_parties_or_admin"
    ON public.appointments FOR SELECT
    TO authenticated
    USING (
        patient_id = auth.uid()
        OR doctor_id = auth.uid()
        OR public.current_role() = 'admin'
    );

CREATE POLICY "appointments_insert_patient_or_admin"
    ON public.appointments FOR INSERT
    TO authenticated
    WITH CHECK (
        patient_id = auth.uid()
        OR public.current_role() = 'admin'
    );

-- Patient can only cancel their own appointment
CREATE POLICY "appointments_update_patient_cancel"
    ON public.appointments FOR UPDATE
    TO authenticated
    USING (patient_id = auth.uid())
    WITH CHECK (
        patient_id = auth.uid()
        AND status = 'cancelled'
    );

-- Doctor can update their own appointments
CREATE POLICY "appointments_update_doctor"
    ON public.appointments FOR UPDATE
    TO authenticated
    USING (doctor_id = auth.uid() OR public.current_role() = 'admin')
    WITH CHECK (doctor_id = auth.uid() OR public.current_role() = 'admin');

-- ==============================================================================
-- 8. Encounters Policies (Medical Record)
-- ==============================================================================
CREATE POLICY "encounters_select_parties_or_consented_or_admin"
    ON public.encounters FOR SELECT
    TO authenticated
    USING (
        patient_id = auth.uid()
        OR doctor_id = auth.uid()
        OR public.current_role() = 'admin'
        OR (public.current_role() = 'doctor' AND public.has_active_consent(patient_id, 'history'))
    );

CREATE POLICY "encounters_insert_doctor_or_admin"
    ON public.encounters FOR INSERT
    TO authenticated
    WITH CHECK (doctor_id = auth.uid() OR public.current_role() = 'admin');

CREATE POLICY "encounters_update_doctor_or_admin"
    ON public.encounters FOR UPDATE
    TO authenticated
    USING (doctor_id = auth.uid() OR public.current_role() = 'admin')
    WITH CHECK (doctor_id = auth.uid() OR public.current_role() = 'admin');

-- ==============================================================================
-- 9. Prescriptions Policies
-- ==============================================================================
CREATE POLICY "prescriptions_select_parties_or_consented_or_admin"
    ON public.prescriptions FOR SELECT
    TO authenticated
    USING (
        patient_id = auth.uid()
        OR doctor_id = auth.uid()
        OR public.current_role() = 'admin'
        OR (public.current_role() = 'doctor' AND public.has_active_consent(patient_id, 'prescriptions'))
    );

CREATE POLICY "prescriptions_insert_doctor_or_admin"
    ON public.prescriptions FOR INSERT
    TO authenticated
    WITH CHECK (doctor_id = auth.uid() OR public.current_role() = 'admin');

CREATE POLICY "prescriptions_update_doctor_or_admin"
    ON public.prescriptions FOR UPDATE
    TO authenticated
    USING (doctor_id = auth.uid() OR public.current_role() = 'admin')
    WITH CHECK (doctor_id = auth.uid() OR public.current_role() = 'admin');

-- ==============================================================================
-- 10. Lab Reports Policies
-- ==============================================================================
CREATE POLICY "lab_reports_select_parties_or_consented_or_admin"
    ON public.lab_reports FOR SELECT
    TO authenticated
    USING (
        patient_id = auth.uid()
        OR uploaded_by = auth.uid()
        OR public.current_role() = 'admin'
        OR (public.current_role() = 'doctor' AND public.has_active_consent(patient_id, 'labs'))
    );

CREATE POLICY "lab_reports_insert_patient_or_uploader_or_admin"
    ON public.lab_reports FOR INSERT
    TO authenticated
    WITH CHECK (
        patient_id = auth.uid()
        OR uploaded_by = auth.uid()
        OR public.current_role() = 'admin'
    );

CREATE POLICY "lab_reports_update_uploader_or_admin"
    ON public.lab_reports FOR UPDATE
    TO authenticated
    USING (uploaded_by = auth.uid() OR public.current_role() = 'admin')
    WITH CHECK (uploaded_by = auth.uid() OR public.current_role() = 'admin');

-- ==============================================================================
-- 11. Consents Policies (Patient Managed)
-- ==============================================================================
CREATE POLICY "consents_select_parties_or_admin"
    ON public.consents FOR SELECT
    TO authenticated
    USING (
        patient_id = auth.uid()
        OR doctor_id = auth.uid()
        OR public.current_role() = 'admin'
    );

CREATE POLICY "consents_insert_patient_own"
    ON public.consents FOR INSERT
    TO authenticated
    WITH CHECK (patient_id = auth.uid());

CREATE POLICY "consents_update_patient_own_or_admin"
    ON public.consents FOR UPDATE
    TO authenticated
    USING (patient_id = auth.uid() OR public.current_role() = 'admin')
    WITH CHECK (patient_id = auth.uid() OR public.current_role() = 'admin');

-- ==============================================================================
-- 12. Record Access Logs Policies (Append-Only, Immutable)
-- ==============================================================================
CREATE POLICY "record_access_logs_select_patient_or_admin"
    ON public.record_access_logs FOR SELECT
    TO authenticated
    USING (patient_id = auth.uid() OR public.current_role() = 'admin');

CREATE POLICY "record_access_logs_insert_authenticated"
    ON public.record_access_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- NO UPDATE OR DELETE POLICIES CREATED FOR record_access_logs (strictly DENIED)

-- ==============================================================================
-- 13. Referrals Policies
-- ==============================================================================
CREATE POLICY "referrals_select_parties_or_admin"
    ON public.referrals FOR SELECT
    TO authenticated
    USING (
        patient_id = auth.uid()
        OR from_doctor_id = auth.uid()
        OR to_doctor_id = auth.uid()
        OR public.current_role() = 'admin'
    );

CREATE POLICY "referrals_insert_doctor_or_admin"
    ON public.referrals FOR INSERT
    TO authenticated
    WITH CHECK (from_doctor_id = auth.uid() OR public.current_role() = 'admin');

CREATE POLICY "referrals_update_involved_doctors_or_admin"
    ON public.referrals FOR UPDATE
    TO authenticated
    USING (
        from_doctor_id = auth.uid()
        OR to_doctor_id = auth.uid()
        OR public.current_role() = 'admin'
    )
    WITH CHECK (
        from_doctor_id = auth.uid()
        OR to_doctor_id = auth.uid()
        OR public.current_role() = 'admin'
    );
