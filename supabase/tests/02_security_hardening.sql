-- ==============================================================================
-- MediSeba V3 Comprehensive Security Hardening pgTAP Test Suite
-- ==============================================================================
BEGIN;
SELECT plan(18);

-- Test Setup / IDs from seed data:
-- Patient 1: p0000000-0000-0000-0000-000000000001 (Kamal Hossain)
-- Patient 2: p0000000-0000-0000-0000-000000000002 (Shirin Akhter)
-- Doctor 1:  d0000000-0000-0000-0000-000000000001 (Dr. Anisur Rahman - active consent: history, prescriptions, labs for Patient 1)
-- Doctor 2:  d0000000-0000-0000-0000-000000000002 (Dr. Farhana Yasmin - NO consent for Patient 1)
-- Doctor 3:  d0000000-0000-0000-0000-000000000003 (Dr. Mahmudul Hasan - revoked consent for Patient 2)
-- Doctor 6:  d0000000-0000-0000-0000-000000000006 (Dr. Rashida Begum - unverified doctor candidate)

-- ------------------------------------------------------------------------------
-- Test 1: Direct INSERT on record_access_logs is strictly denied
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "p0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT throws_ok(
    'INSERT INTO public.record_access_logs (patient_id, accessor_id, action, resource_type, allowed) VALUES (''p0000000-0000-0000-0000-000000000001'', ''d0000000-0000-0000-0000-000000000001'', ''SELECT'', ''patients'', true)',
    '42501',
    NULL,
    'Test 1: Direct table INSERT on record_access_logs is revoked from authenticated users'
);

-- ------------------------------------------------------------------------------
-- Test 2: Logging via SECURITY DEFINER function enforces accessor_id = auth.uid()
-- ------------------------------------------------------------------------------
SELECT isnt_empty(
    'SELECT public.log_record_access(''p0000000-0000-0000-0000-000000000001'', ''SELECT'', ''patients'', NULL, true, ''Legitimate view'')',
    'Test 2: Valid access logging via function succeeds'
);

-- ------------------------------------------------------------------------------
-- Test 3: Trigger blocks any UPDATE on record_access_logs
-- ------------------------------------------------------------------------------
SELECT throws_ok(
    'UPDATE public.record_access_logs SET reason = ''tampered'' WHERE patient_id = ''p0000000-0000-0000-0000-000000000001''',
    'P0001',
    'Security Violation: record_access_logs is strictly append-only. Modification or deletion is forbidden.',
    'Test 3: UPDATE on record_access_logs is blocked by trigger'
);

-- ------------------------------------------------------------------------------
-- Test 4: Trigger blocks any DELETE on record_access_logs
-- ------------------------------------------------------------------------------
SELECT throws_ok(
    'DELETE FROM public.record_access_logs WHERE patient_id = ''p0000000-0000-0000-0000-000000000001''',
    'P0001',
    'Security Violation: record_access_logs is strictly append-only. Modification or deletion is forbidden.',
    'Test 4: DELETE on record_access_logs is blocked by trigger'
);

-- ------------------------------------------------------------------------------
-- Test 5: Patient cannot promote themselves to admin on UPDATE
-- ------------------------------------------------------------------------------
SELECT throws_ok(
    'UPDATE public.profiles SET role = ''admin'' WHERE id = ''p0000000-0000-0000-0000-000000000001''',
    'P0001',
    'Unauthorized: Users cannot change their own or other roles.',
    'Test 5: Patient cannot elevate own role to admin on UPDATE'
);

-- ------------------------------------------------------------------------------
-- Test 6: Doctor cannot self-verify via direct UPDATE
-- ------------------------------------------------------------------------------
SET LOCAL "request.jwt.claims" = '{"sub": "d0000000-0000-0000-0000-000000000006", "role": "authenticated"}';

SELECT throws_ok(
    'UPDATE public.doctors SET is_verified = true WHERE id = ''d0000000-0000-0000-0000-000000000006''',
    'P0001',
    'Unauthorized: Only administrators can verify doctor profiles.',
    'Test 6: Doctor candidate cannot self-verify'
);

-- ------------------------------------------------------------------------------
-- Test 7: Patient cannot insert verified doctor profile directly
-- ------------------------------------------------------------------------------
SET LOCAL "request.jwt.claims" = '{"sub": "p0000000-0000-0000-0000-000000000002", "role": "authenticated"}';

SELECT throws_ok(
    'INSERT INTO public.doctors (id, bmdc_number, specialty, is_verified) VALUES (''p0000000-0000-0000-0000-000000000002'', ''BMDC-FAKE-123'', ''Cardiology'', true)',
    '42501',
    NULL,
    'Test 7: Direct insertion of verified doctor is denied by RLS policy'
);

-- ------------------------------------------------------------------------------
-- Test 8: Patient cannot modify doctor-authored encounters
-- ------------------------------------------------------------------------------
SELECT throws_ok(
    'UPDATE public.encounters SET diagnosis_text = ''tampered diagnosis'' WHERE patient_id = ''p0000000-0000-0000-0000-000000000001''',
    '42501',
    NULL,
    'Test 8: Patient cannot update clinical encounter records'
);

-- ------------------------------------------------------------------------------
-- Test 9: Patient cannot modify doctor-authored prescriptions
-- ------------------------------------------------------------------------------
SELECT throws_ok(
    'UPDATE public.prescriptions SET advice = ''tampered advice'' WHERE patient_id = ''p0000000-0000-0000-0000-000000000001''',
    '42501',
    NULL,
    'Test 9: Patient cannot update clinical prescriptions'
);

-- ------------------------------------------------------------------------------
-- Test 10: Patient cancelling appointment cannot alter doctor_id, patient_id, or scheduled_at
-- ------------------------------------------------------------------------------
SET LOCAL "request.jwt.claims" = '{"sub": "p0000000-0000-0000-0000-000000000003", "role": "authenticated"}';

SELECT throws_ok(
    'UPDATE public.appointments SET status = ''cancelled'', doctor_id = ''d0000000-0000-0000-0000-000000000004'' WHERE id = ''b0000000-0000-0000-0000-000000000008''',
    'P0001',
    'Forbidden: doctor_id on appointment cannot be changed.',
    'Test 10: Patient cannot alter doctor_id during appointment cancellation'
);

-- ------------------------------------------------------------------------------
-- Test 11: Doctor 1 cannot modify Doctor 2 appointment
-- ------------------------------------------------------------------------------
SET LOCAL "request.jwt.claims" = '{"sub": "d0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT throws_ok(
    'UPDATE public.appointments SET status = ''cancelled'' WHERE id = ''b0000000-0000-0000-0000-000000000002''',
    'P0001',
    'Unauthorized: You are neither the patient nor the doctor for this appointment.',
    'Test 11: Doctor 1 cannot modify Doctor 2 appointment'
);

-- ------------------------------------------------------------------------------
-- Test 12: Doctor with limited scope ('prescriptions') cannot read other scopes ('history')
-- ------------------------------------------------------------------------------
RESET ROLE;
-- Setup temporary single-scope consent: Patient 4 grants Doctor 4 ONLY 'prescriptions' scope
INSERT INTO public.consents (id, patient_id, doctor_id, scope, status, expires_at)
VALUES ('10000000-0000-0000-0000-000000000099', 'p0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', ARRAY['prescriptions'], 'active', now() + interval '1 day')
ON CONFLICT (id) DO NOTHING;

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "d0000000-0000-0000-0000-000000000004", "role": "authenticated"}';

-- Can read prescriptions
SELECT isnt_empty(
    'SELECT * FROM public.prescriptions WHERE patient_id = ''p0000000-0000-0000-0000-000000000004''',
    'Test 12a: Doctor with prescriptions scope can read prescriptions'
);

-- Cannot read patient demographic details (requires 'history')
SELECT is_empty(
    'SELECT * FROM public.patients WHERE id = ''p0000000-0000-0000-0000-000000000004''',
    'Test 12b: Doctor with prescriptions-only scope cannot read patient history profile'
);

-- Cannot read lab reports (requires 'labs')
SELECT is_empty(
    'SELECT * FROM public.lab_reports WHERE patient_id = ''p0000000-0000-0000-0000-000000000004''',
    'Test 12c: Doctor with prescriptions-only scope cannot read lab reports'
);

-- ------------------------------------------------------------------------------
-- Test 13: Expired consent blocks access
-- ------------------------------------------------------------------------------
RESET ROLE;
-- Setup expired consent
INSERT INTO public.consents (id, patient_id, doctor_id, scope, status, expires_at)
VALUES ('10000000-0000-0000-0000-000000000098', 'p0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', ARRAY['history', 'prescriptions'], 'active', now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "d0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT is_empty(
    'SELECT * FROM public.patients WHERE id = ''p0000000-0000-0000-0000-000000000005''',
    'Test 13: Expired consent blocks doctor access'
);

-- ------------------------------------------------------------------------------
-- Test 14: Anonymous users cannot query base doctors table directly
-- ------------------------------------------------------------------------------
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role": "anon"}';

SELECT throws_ok(
    'SELECT * FROM public.doctors',
    '42501',
    NULL,
    'Test 14a: Anonymous cannot select directly from base doctors table'
);

SELECT isnt_empty(
    'SELECT * FROM public.public_doctors',
    'Test 14b: Anonymous can select from security-barrier public_doctors view'
);

-- ------------------------------------------------------------------------------
-- Test 15: Anonymous cannot access any medical table
-- ------------------------------------------------------------------------------
SELECT throws_ok(
    'SELECT * FROM public.prescriptions',
    '42501',
    NULL,
    'Test 15: Anonymous is denied access to prescriptions'
);

SELECT * FROM finish();
ROLLBACK;
