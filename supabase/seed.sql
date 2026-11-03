-- ==============================================================================
-- MediSeba V3 Synthetic Seed Data (Strictly Synthetic / Non-Production Data)
-- ==============================================================================

-- 1. Create Synthetic auth.users Entries
-- (Passwords hashed with default bcrypt for test convenience)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
    -- Admin User
    ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@mediseba.test', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tariqul Islam"}', now(), now()),
    -- 5 Verified Doctors
    ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dr.anisur@mediseba.test', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Anisur Rahman"}', now(), now()),
    ('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dr.farhana@mediseba.test', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Farhana Yasmin"}', now(), now()),
    ('d0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dr.mahmudul@mediseba.test', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Mahmudul Hasan"}', now(), now()),
    ('d0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dr.nusrat@mediseba.test', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Nusrat Jahan"}', now(), now()),
    ('d0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dr.tanvir@mediseba.test', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Kazi Tanvir"}', now(), now()),
    -- 1 Unverified Doctor
    ('d0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dr.rashida@mediseba.test', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Rashida Begum"}', now(), now()),
    -- 5 Patients
    ('p0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kamal@mediseba.test', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Kamal Hossain"}', now(), now()),
    ('p0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'shirin@mediseba.test', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Shirin Akhter"}', now(), now()),
    ('p0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rafiqul@mediseba.test', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rafiqul Islam"}', now(), now()),
    ('p0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nazmun@mediseba.test', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nazmun Nahar"}', now(), now()),
    ('p0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tanvir.p@mediseba.test', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tanvir Ahmed"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 2. Update Profiles (Roles and Contact Details)
UPDATE public.profiles SET role = 'admin', full_name = 'Tariqul Islam', phone = '+8801711000001' WHERE id = 'a0000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET role = 'doctor', full_name = 'Dr. Anisur Rahman', phone = '+8801711000002' WHERE id = 'd0000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET role = 'doctor', full_name = 'Dr. Farhana Yasmin', phone = '+8801711000003' WHERE id = 'd0000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET role = 'doctor', full_name = 'Dr. Mahmudul Hasan', phone = '+8801711000004' WHERE id = 'd0000000-0000-0000-0000-000000000003';
UPDATE public.profiles SET role = 'doctor', full_name = 'Dr. Nusrat Jahan', phone = '+8801711000005' WHERE id = 'd0000000-0000-0000-0000-000000000004';
UPDATE public.profiles SET role = 'doctor', full_name = 'Dr. Kazi Tanvir', phone = '+8801711000006' WHERE id = 'd0000000-0000-0000-0000-000000000005';
UPDATE public.profiles SET role = 'doctor', full_name = 'Dr. Rashida Begum', phone = '+8801711000007' WHERE id = 'd0000000-0000-0000-0000-000000000006';

UPDATE public.profiles SET phone = '+8801811000001' WHERE id = 'p0000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET phone = '+8801811000002' WHERE id = 'p0000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET phone = '+8801811000003' WHERE id = 'p0000000-0000-0000-0000-000000000003';
UPDATE public.profiles SET phone = '+8801811000004' WHERE id = 'p0000000-0000-0000-0000-000000000004';
UPDATE public.profiles SET phone = '+8801811000005' WHERE id = 'p0000000-0000-0000-0000-000000000005';

-- 3. Facilities
INSERT INTO public.facilities (id, name, type, district, address)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'Dhaka Central General Hospital', 'hospital', 'Dhaka', 'Green Road, Dhanmondi, Dhaka'),
    ('f0000000-0000-0000-0000-000000000002', 'Chattogram Specialized Medical Care', 'clinic', 'Chittagong', 'GEC Circle, Nasirabad, Chittagong'),
    ('f0000000-0000-0000-0000-000000000003', 'Sylhet Digital Diagnostic & Telehealth', 'diagnostic_center', 'Sylhet', 'Subidbazar, Sylhet')
ON CONFLICT (id) DO NOTHING;

-- 4. Doctors (5 Verified, 1 Unverified)
INSERT INTO public.doctors (id, bmdc_number, specialty, facility_id, bio, consultation_fee, is_verified, verified_at, verified_by)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'BMDC-A-41092', 'Cardiology', 'f0000000-0000-0000-0000-000000000001', 'Senior Interventional Cardiologist specializing in cardiovascular diagnostics and post-CABG care.', 800.00, true, now(), 'a0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000002', 'BMDC-A-52814', 'Pediatrics', 'f0000000-0000-0000-0000-000000000002', 'Pediatrician dedicated to neonatal development, childhood immunizations, and preventive nutrition.', 700.00, true, now(), 'a0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000003', 'BMDC-A-38741', 'Neurology', 'f0000000-0000-0000-0000-000000000003', 'Consultant Neurologist focusing on epilepsy, migraine syndromes, and neuro-rehabilitation.', 1000.00, true, now(), 'a0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000004', 'BMDC-A-63920', 'Dermatology', 'f0000000-0000-0000-0000-000000000001', 'Clinical Dermatologist with expertise in allergic contact dermatitis and phototherapy.', 600.00, true, now(), 'a0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000005', 'BMDC-A-47219', 'General Medicine', 'f0000000-0000-0000-0000-000000000002', 'Family Physician providing continuous primary healthcare, diabetes, and hypertension monitoring.', 500.00, true, now(), 'a0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000006', 'BMDC-A-99201', 'Orthopedics', NULL, 'Orthopedic surgeon candidate awaiting credential validation.', 600.00, false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 5. Patients
INSERT INTO public.patients (id, patient_code, date_of_birth, gender, blood_group, address_district, allergies, chronic_conditions, emergency_contact_name, emergency_contact_phone)
VALUES
    ('p0000000-0000-0000-0000-000000000001', 'MS-KAM001', '1988-04-12', 'male', 'A+', 'Dhaka', 'Penicillin', 'Type 2 Diabetes', 'Rahima Hossain', '+8801811999001'),
    ('p0000000-0000-0000-0000-000000000002', 'MS-SHI002', '1994-09-23', 'female', 'B+', 'Chittagong', 'Sulfa drugs', 'Bronchial Asthma', 'Jamal Uddin', '+8801811999002'),
    ('p0000000-0000-0000-0000-000000000003', 'MS-RAF003', '1976-11-05', 'male', 'O+', 'Sylhet', 'None known', 'Essential Hypertension', 'Salma Begum', '+8801811999003'),
    ('p0000000-0000-0000-0000-000000000004', 'MS-NAZ004', '2001-02-18', 'female', 'AB+', 'Rajshahi', 'Dust, Pollen', 'None', 'Abul Kashem', '+8801811999004'),
    ('p0000000-0000-0000-0000-000000000005', 'MS-TAN005', '1990-07-30', 'male', 'O-', 'Khulna', 'NSAIDs', 'Mild GERD', 'Nasrin Sultana', '+8801811999005')
ON CONFLICT (id) DO UPDATE SET
    date_of_birth = EXCLUDED.date_of_birth,
    gender = EXCLUDED.gender,
    blood_group = EXCLUDED.blood_group,
    address_district = EXCLUDED.address_district,
    allergies = EXCLUDED.allergies,
    chronic_conditions = EXCLUDED.chronic_conditions;

-- 6. Doctor Schedules
INSERT INTO public.doctor_schedules (id, doctor_id, weekday, start_time, end_time, slot_minutes, max_patients, is_active)
VALUES
    ('s0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Sunday', '17:00:00', '21:00:00', 15, 16, true),
    ('s0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Tuesday', '17:00:00', '21:00:00', 15, 16, true),
    ('s0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'Monday', '09:00:00', '13:00:00', 20, 12, true),
    ('s0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'Wednesday', '16:00:00', '20:00:00', 20, 12, true),
    ('s0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', 'Thursday', '10:00:00', '14:00:00', 15, 16, true),
    ('s0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000005', 'Saturday', '09:00:00', '13:00:00', 15, 16, true)
ON CONFLICT (id) DO NOTHING;

-- 7. Appointments (10 Appointments)
INSERT INTO public.appointments (id, patient_id, doctor_id, scheduled_at, token_number, status, reason)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', now() - interval '14 days', 1, 'completed', 'Routine cardiovascular follow-up'),
    ('b0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', now() - interval '10 days', 1, 'completed', 'Recurrent wheezing and shortness of breath'),
    ('b0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', now() - interval '8 days', 1, 'completed', 'Chronic throbbing headache and visual aura'),
    ('b0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', now() - interval '6 days', 1, 'completed', 'Erythematous skin rash on both forearms'),
    ('b0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', now() - interval '4 days', 1, 'completed', 'Fatigue, increased thirst, and high fasting glucose'),
    ('b0000000-0000-0000-0000-000000000006', 'p0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', now() - interval '2 days', 2, 'completed', 'Annual metabolic wellness checkup'),
    ('b0000000-0000-0000-0000-000000000007', 'p0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', now() - interval '1 day', 2, 'completed', 'Heart palpitations during physical exertion'),
    ('b0000000-0000-0000-0000-000000000008', 'p0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000005', now() + interval '2 days', 3, 'confirmed', 'Blood pressure titration visit'),
    ('b0000000-0000-0000-0000-000000000009', 'p0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', now() + interval '5 days', 2, 'pending', 'Seasonal asthma assessment'),
    ('b0000000-0000-0000-0000-000000000010', 'p0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', now() - interval '3 days', 4, 'cancelled', 'Patient rescheduled due to travel')
ON CONFLICT (id) DO NOTHING;

-- 8. Encounters (8 Completed Medical Consultations)
INSERT INTO public.encounters (id, patient_id, doctor_id, facility_id, appointment_id, visit_date, chief_complaint, notes, diagnosis_text, follow_up_date)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', now() - interval '14 days', 'Chest heaviness on stairs for 2 weeks', 'BP 138/86 mmHg, heart sounds regular, S1/S2 heard, no murmur.', 'Mild stable angina pectoris secondary to dyslipidemia', (now() + interval '30 days')::date),
    ('e0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', now() - interval '10 days', 'Cough with nocturnal wheeze', 'Bilateral polyphonic rhonchi noted on expiration. SpO2 97% on room air.', 'Moderate persistent asthma exacerbation', (now() + interval '14 days')::date),
    ('e0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', now() - interval '8 days', 'Unilateral pulsating headache with photophobia', 'Cranial nerves II-XII intact. No meningeal irritation signs.', 'Migraine without aura, acute phase', (now() + interval '45 days')::date),
    ('e0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', now() - interval '6 days', 'Intense itching with papulovesicular lesions', 'Well-demarcated eczematous patches on flexural surfaces.', 'Subacute allergic contact dermatitis', (now() + interval '21 days')::date),
    ('e0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', now() - interval '4 days', 'Polyuria, polydipsia, and unexplained fatigue', 'Fasting blood sugar 9.4 mmol/L, HbA1c 7.6%. BMI 27.2.', 'Uncontrolled Type 2 Diabetes Mellitus with overweight', (now() + interval '30 days')::date),
    ('e0000000-0000-0000-0000-000000000006', 'p0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', now() - interval '2 days', 'Metabolic panel review and dietary guidance', 'Urine microalbumin negative. eGFR > 90. Blood sugar logs stable.', 'Well-controlled Type 2 Diabetes on monotherapy', (now() + interval '90 days')::date),
    ('e0000000-0000-0000-0000-000000000007', 'p0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', now() - interval '1 day', 'Sudden rapid heartbeat while resting', 'Resting ECG shows sinus tachycardia, PR 0.16s, QTc 410ms. Thyroid panel requested.', 'Sinus tachycardia, rule out hyperthyroidism vs anxiety', (now() + interval '10 days')::date),
    ('e0000000-0000-0000-0000-000000000008', 'p0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', NULL, now() - interval '20 days', 'Secondary hypertension evaluation', 'Cardiovascular exam unremarkable. Renal Doppler normal.', 'Primary essential hypertension stage 1', (now() + interval '60 days')::date)
ON CONFLICT (id) DO NOTHING;

-- 9. Prescriptions (8 Linked Prescriptions)
INSERT INTO public.prescriptions (id, encounter_id, patient_id, doctor_id, items, advice)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 
     '[{"medicine":"Tab. Atorvastatin 20mg","dosage":"0-0-1","duration":"30 days","instructions":"After dinner"},{"medicine":"Tab. Aspirin 75mg","dosage":"1-0-0","duration":"30 days","instructions":"After breakfast"},{"medicine":"Tab. Metoprolol 25mg","dosage":"1-0-0","duration":"30 days","instructions":"Morning"}]'::jsonb, 
     'Low-salt, low-cholesterol diet. Daily 30-minute brisk walk. Avoid strenuous exertion until lipid panel review.'),

    ('c0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 
     '[{"medicine":"Inhaler Budesonide/Formoterol 160/4.5mcg","dosage":"2 puffs BD","duration":"30 days","instructions":"Rinse mouth after use"},{"medicine":"Tab. Montelukast 10mg","dosage":"0-0-1","duration":"14 days","instructions":"Night"}]'::jsonb, 
     'Avoid dust, mosquito coils, and cold drinks. Use spacer device with inhaler.'),

    ('c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 
     '[{"medicine":"Tab. Naproxen 500mg + Esomeprazole 20mg","dosage":"1-0-1","duration":"5 days","instructions":"During headache episodes"},{"medicine":"Tab. Flunarizine 10mg","dosage":"0-0-1","duration":"30 days","instructions":"Nightly prophylactic"}]'::jsonb, 
     'Maintain regular sleep schedule. Limit screen time in darkness. Keep a headache diary.'),

    ('c0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 
     '[{"medicine":"Cream Mometasone Furoate 0.1%","dosage":"Apply BD","duration":"7 days","instructions":"Thin layer on affected areas"},{"medicine":"Tab. Fexofenadine 120mg","dosage":"1-0-1","duration":"10 days","instructions":"Before meals"}]'::jsonb, 
     'Use mild hypoallergenic moisturizing soap. Avoid direct contact with detergents and latex.'),

    ('c0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 
     '[{"medicine":"Tab. Metformin 500mg","dosage":"1-0-1","duration":"30 days","instructions":"With meals"},{"medicine":"Tab. Empagliflozin 10mg","dosage":"1-0-0","duration":"30 days","instructions":"Morning with water"}]'::jsonb, 
     'Strict carbohydrate restriction. Maintain adequate hydration. Check blood sugar twice weekly.'),

    ('c0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 
     '[{"medicine":"Tab. Metformin 850mg","dosage":"1-0-1","duration":"90 days","instructions":"With meals"},{"medicine":"Cap. Vitamin D3 20000 IU","dosage":"1 cap weekly","duration":"8 weeks","instructions":"With fatty meal"}]'::jsonb, 
     'Continue current balanced diet and exercise routine. Recheck HbA1c in 3 months.'),

    ('c0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 
     '[{"medicine":"Tab. Bisoprolol 2.5mg","dosage":"1-0-0","duration":"14 days","instructions":"Morning after breakfast"}]'::jsonb, 
     'Avoid caffeine and nicotine. Complete serum TSH and electrolyte labs before follow-up.'),

    ('c0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 
     '[{"medicine":"Tab. Amlodipine 5mg","dosage":"1-0-0","duration":"30 days","instructions":"Morning"},{"medicine":"Tab. Telmisartan 40mg","dosage":"0-0-1","duration":"30 days","instructions":"Night"}]'::jsonb, 
     'Monitor home blood pressure twice daily for 7 days. Limit dietary sodium to < 2g per day.')
ON CONFLICT (id) DO NOTHING;

-- 10. Lab Reports (Stored with path convention: {patient_id}/{filename})
INSERT INTO public.lab_reports (id, patient_id, uploaded_by, encounter_id, title, file_path, report_date)
VALUES
    ('l0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Complete Lipid Profile & Serum Creatinine', 'p0000000-0000-0000-0000-000000000001/lipid_profile_2026.pdf', (now() - interval '13 days')::date),
    ('l0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'Spirometry & Peak Flow Analysis', 'p0000000-0000-0000-0000-000000000002/spirometry_report.pdf', (now() - interval '9 days')::date),
    ('l0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000005', 'HbA1c & Fasting Plasma Glucose', 'p0000000-0000-0000-0000-000000000005/hba1c_oct2026.pdf', (now() - interval '3 days')::date)
ON CONFLICT (id) DO NOTHING;

-- 11. Consents (1 Active, 1 Revoked)
INSERT INTO public.consents (id, patient_id, doctor_id, scope, status, token_hash, expires_at, created_at, revoked_at)
VALUES
    -- Active Consent: Patient 1 gives Doctor 1 full access for 30 days
    ('10000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', ARRAY['history', 'prescriptions', 'labs'], 'active', 'thash_synthetic_01', now() + interval '30 days', now() - interval '14 days', NULL),
    -- Revoked Consent: Patient 2 revoked access from Doctor 3
    ('10000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', ARRAY['history'], 'revoked', 'thash_synthetic_02', now() + interval '7 days', now() - interval '5 days', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- 12. Record Access Logs (Immutable Audit Trail)
INSERT INTO public.record_access_logs (id, patient_id, accessor_id, action, resource_type, resource_id, allowed, reason, created_at)
VALUES
    ('70000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'SELECT', 'encounters', 'e0000000-0000-0000-0000-000000000001', true, 'Authorized clinical consultation', now() - interval '14 days'),
    ('70000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 'SELECT', 'patients', 'p0000000-0000-0000-0000-000000000002', false, 'Consent revoked by patient', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;
