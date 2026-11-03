-- ==============================================================================
-- MediSeba V3 pgTAP RLS Security Test Suite
-- ==============================================================================
BEGIN;
SELECT plan(13);

-- Test Setup / IDs from seed data:
-- Patient 1: p0000000-0000-0000-0000-000000000001 (Kamal Hossain)
-- Patient 2: p0000000-0000-0000-0000-000000000002 (Shirin Akhter)
-- Doctor 1:  d0000000-0000-0000-0000-000000000001 (Dr. Anisur Rahman - has active consent for Patient 1)
-- Doctor 2:  d0000000-0000-0000-0000-000000000002 (Dr. Farhana Yasmin - has NO consent for Patient 1)
-- Doctor 3:  d0000000-0000-0000-0000-000000000003 (Dr. Mahmudul Hasan - revoked consent for Patient 2)

-- ------------------------------------------------------------------------------
-- Test 1: Patient 1 cannot select Patient 2's medical records (patients/encounters/prescriptions/lab_reports)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "p0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT is_empty(
    'SELECT * FROM public.patients WHERE id = ''p0000000-0000-0000-0000-000000000002''',
    'Test 1a: Patient 1 cannot read Patient 2 profile'
);

SELECT is_empty(
    'SELECT * FROM public.encounters WHERE patient_id = ''p0000000-0000-0000-0000-000000000002''',
    'Test 1b: Patient 1 cannot read Patient 2 encounters'
);

SELECT is_empty(
    'SELECT * FROM public.prescriptions WHERE patient_id = ''p0000000-0000-0000-0000-000000000002''',
    'Test 1c: Patient 1 cannot read Patient 2 prescriptions'
);

SELECT is_empty(
    'SELECT * FROM public.lab_reports WHERE patient_id = ''p0000000-0000-0000-0000-000000000002''',
    'Test 1d: Patient 1 cannot read Patient 2 lab reports'
);

-- ------------------------------------------------------------------------------
-- Test 2: Doctor 2 (without consent) cannot read Patient 1's records
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "d0000000-0000-0000-0000-000000000002", "role": "authenticated"}';

SELECT is_empty(
    'SELECT * FROM public.patients WHERE id = ''p0000000-0000-0000-0000-000000000001''',
    'Test 2: Doctor without consent cannot read patient record'
);

-- ------------------------------------------------------------------------------
-- Test 3: Doctor 1 (with active consent) can read Patient 1's consented records
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "d0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT isnt_empty(
    'SELECT * FROM public.patients WHERE id = ''p0000000-0000-0000-0000-000000000001''',
    'Test 3: Doctor with active consent can read consented patient record'
);

-- ------------------------------------------------------------------------------
-- Test 4: After consent is revoked, access is blocked (Doctor 3 on Patient 2)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "d0000000-0000-0000-0000-000000000003", "role": "authenticated"}';

SELECT is_empty(
    'SELECT * FROM public.patients WHERE id = ''p0000000-0000-0000-0000-000000000002''',
    'Test 4: Doctor with revoked consent cannot read patient record'
);

-- ------------------------------------------------------------------------------
-- Test 5: Patient cannot verify doctor; Doctor cannot self-verify
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "d0000000-0000-0000-0000-000000000006", "role": "authenticated"}';

SELECT throws_ok(
    'UPDATE public.doctors SET is_verified = true WHERE id = ''d0000000-0000-0000-0000-000000000006''',
    'P0001',
    'Unauthorized: Only administrators can verify doctor profiles.',
    'Test 5: Unverified doctor cannot self-verify'
);

-- ------------------------------------------------------------------------------
-- Test 6: User cannot change own profiles.role
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "p0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT throws_ok(
    'UPDATE public.profiles SET role = ''admin'' WHERE id = ''p0000000-0000-0000-0000-000000000001''',
    'P0001',
    'Unauthorized: Users cannot change their own or other roles.',
    'Test 6: User cannot change own profile role'
);

-- ------------------------------------------------------------------------------
-- Test 7: Anonymous can read public_doctors view but nothing medical
-- ------------------------------------------------------------------------------
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role": "anon"}';

SELECT isnt_empty(
    'SELECT * FROM public.public_doctors',
    'Test 7a: Anonymous can read public_doctors view'
);

SELECT throws_ok(
    'SELECT * FROM public.patients',
    '42501',
    NULL,
    'Test 7b: Anonymous is denied SELECT on patients table'
);

-- ------------------------------------------------------------------------------
-- Test 8: record_access_logs cannot be updated or deleted by any role
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "p0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

-- Update attempt produces 0 rows modified due to absence of UPDATE policy
UPDATE public.record_access_logs SET action = 'TAMPERED' WHERE id = '70000000-0000-0000-0000-000000000001';
SELECT is_empty(
    'SELECT * FROM public.record_access_logs WHERE action = ''TAMPERED''',
    'Test 8: record_access_logs cannot be modified (immutable)'
);

-- ------------------------------------------------------------------------------
-- Test 9: Doctor 1 cannot update Doctor 2's appointments
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "d0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

-- Appointment b...02 belongs to Doctor 2 (d...02)
UPDATE public.appointments SET status = 'cancelled' WHERE id = 'b0000000-0000-0000-0000-000000000002';

-- Reset to service role to inspect if the update was blocked
RESET ROLE;
SELECT results_eq(
    'SELECT status FROM public.appointments WHERE id = ''b0000000-0000-0000-0000-000000000002''',
    ARRAY['completed'],
    'Test 9: Doctor 1 cannot update Doctor 2 appointment status'
);

SELECT * FROM finish();
ROLLBACK;
