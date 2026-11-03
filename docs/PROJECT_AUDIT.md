# MediSeba V3 (MediSeba Connect) — Comprehensive Project Audit

**Document:** `docs/PROJECT_AUDIT.md`  
**Date:** November 2026  
**Auditor:** Senior Full-Stack, Security, & Database Architect  
**Repository:** [mohammademon10/MEDISEBA_APP_V2.0](https://github.com/mohammademon10/MEDISEBA_APP_V2.0)  
**Branch:** `feature/v3-supabase` (targeting `develop/v3` and `main`)  
**Tagline:** *One Patient. One Health Record. Connected Care.*

---

## 1. Executive Summary

MediSeba Connect is transitioning from a legacy Firebase/Firestore-based prototype (V2.0) to an enterprise-grade, secure, multi-tenant digital health platform (V3.0) backed by **Supabase PostgreSQL** with granular Row-Level Security (RLS), **React 19 + TypeScript + Vite 6** frontend, and **Netlify** continuous deployment.

This audit provides a complete inspection of the codebase across Git history, frontend routing, database migrations, security posture, authentication workflows, and deployment infrastructure.

---

## 2. Git & Version Control State

### 2.1 Branch Topology
- `main` (`7cd3e4f`): Production branch tracking `origin/main`.
- `develop/v3` (`7cd3e4f`): Integration branch created from main.
- `release/v2-stable` (`7cd3e4f`): Recovery snapshot of original V2 codebase.
- `feature/v3-security` (`7cd3e4f`): Security audit branch.
- `feature/v3-supabase` (`f70649c`): Active database migration & hardening branch. Currently ahead by 3 commits:
  1. `f5c7c4a`: Supabase schema, RLS policies, seed data, and pgTAP test suites.
  2. `936d5f4`: Security hardening (RLS policies, audit log immutability, doctor registration trigger, storage scoping).
  3. `f70649c`: Docker-free remote staging database test runner (`scripts/run-staging-db-tests.mjs`).

### 2.2 Working Tree Status
- Working tree is clean.
- `.gitignore` correctly ignores `node_modules/`, `dist/`, `.env*` (preserving `!.env.example`).
- Secrets and connection strings are excluded from Git tracking.

---

## 3. Current Architecture & Tech Stack

| Layer | Component | Version / Provider | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + TypeScript + Vite | React 19.0.0, Vite 6.2.0, TS 5.8.2 | Implemented & Compiling |
| **Styling** | Tailwind CSS v4 + Motion | `@tailwindcss/vite` 4.1.14, `motion` 12.23 | Modern, responsive |
| **Routing** | React Router DOM | v7.14.1 | Basic SPA routes (`/`, `/doctors`, `/doctor/:id`, `/dashboard`, `/login`, `/register`) |
| **Current Auth** | Firebase Auth (client) | `firebase` 12.12.0 (Google popup + Email/Password) | Functional V2 legacy |
| **Target Auth** | Supabase Auth (client/db) | `@supabase/supabase-js` 2.118.0 | Client setup ready, DB triggers & roles defined |
| **Current DB** | Google Cloud Firestore | `ai-studio-db09bcc4...` | V2 active in UI |
| **Target DB** | Supabase PostgreSQL | Project `cqcnwpsfmxthfzmuktso` | 5 complete migrations written, RLS enabled |
| **File Storage** | Supabase Storage Bucket | `lab-reports` (private) | Policies defined in migration 04/05 |
| **Server/Backend** | Express (`server.ts`) | Express 4.21.2 + Google Generative AI | Dev server proxy & AI endpoint |
| **AI Integration** | Google Gemini 1.5 Pro | `@google/generative-ai` 0.24.1 | Server-side endpoint `/api/ai/analyze` |
| **Deployment** | Netlify | Static SPA + Edge/Redirects | Configuration pending (`netlify.toml`) |

---

## 4. Existing Features Inventory & Implementation Status

### 4.1 Implemented Features
1. **Public Marketing & Landing Page (`src/components/home/`)**:
   - `Hero.tsx`: Value proposition, dynamic CTA, live stats preview.
   - `Features.tsx`: Unified Health Passport, Smart Queue, AI Prescriptions.
   - `HowItWorks.tsx`: 3-step patient journey.
   - `AIAnalysisDemo.tsx`: Interactive symptom exploration powered by Gemini 1.5 Pro backend endpoint.
   - `Specialties.tsx`: Clinical specialty categories.
   - `FeaturedDoctors.tsx`: Verified doctor highlights.
2. **Doctor Directory (`src/pages/Doctors.tsx`)**:
   - Search by doctor name, specialty filtering.
   - Dynamic Firestore query with local fallback to `FEATURED_DOCTORS`.
3. **Doctor Details & Appointment Booking (`src/pages/DoctorDetail.tsx`)**:
   - Doctor credentials, BMDC qualification, fee display.
   - Slot selection and queue token issuance (`#1`, `#2`, etc.).
4. **Unified User Dashboard (`src/pages/Dashboard.tsx`)**:
   - Displays appointments based on role (`patientId` vs `doctorId`).
   - Doctor status update action (confirm/cancel).
   - Stats summary (total visits, upcoming).
5. **Database Layer (Supabase Migrations in `supabase/migrations/`)**:
   - 12 PostgreSQL tables (`profiles`, `patients`, `doctors`, `facilities`, `doctor_schedules`, `appointments`, `encounters`, `prescriptions`, `lab_reports`, `consents`, `record_access_logs`, `referrals`).
   - Row Level Security (RLS) policies on every table.
   - Audit logging via security definer trigger and function (`log_record_access`).
   - Doctor candidate registration flow (`register_doctor_candidate`).
   - Security-barrier view `public_doctors`.
   - Comprehensive pgTAP test suites (31 assertions).

### 4.2 Incomplete or Missing Features
1. **Admin Portal (`/admin`)**:
   - Currently, there is **no dedicated `/admin` route or Admin Dashboard component** in `src/App.tsx`.
   - Admin capabilities (doctor approval, facility provisioning, system audit log viewing) exist only as database tables/policies, without a UI portal.
2. **Dedicated Role Portals (`/portal`, `/doctor/dashboard`, `/patient/dashboard`)**:
   - Currently, all roles share a generic `/dashboard` route with conditional card rendering.
   - Requirements specify two explicit URL portals:
     - `/admin`: Restricted Admin portal.
     - `/portal`: Shared entry point dispatching to `/doctor/dashboard` or `/patient/dashboard` with verification guards.
3. **Frontend Supabase Database Wiring**:
   - The UI components (`Auth.tsx`, `Dashboard.tsx`, `Doctors.tsx`, `DoctorDetail.tsx`) still read from and write to Firestore (`db` from `src/lib/firebase.ts`).
   - `src/lib/supabase.ts` is initialized with environment variables, but the UI repositories/hooks are not yet connected to Supabase tables.
4. **Doctor Verification Screen**:
   - When a doctor signs up, they remain unverified (`is_verified = false`). Currently, no dedicated "Pending Verification" screen guides them while awaiting admin verification.
5. **Netlify SPA Deep-Linking Configuration**:
   - Missing `netlify.toml` redirect rules (`/* /index.html 200`), causing 404 errors on direct navigation or page refresh on non-root routes.

---

## 5. Firebase vs. Supabase Integration Status

| Capability | Legacy Firebase Implementation | Target Supabase Implementation | Transition State |
| :--- | :--- | :--- | :--- |
| **User Identities** | Firebase Auth (`users` collection) | Supabase Auth (`auth.users` + `public.profiles`) | Migration planned; client dual-ready |
| **Doctor Profiles** | Firestore `doctors/{id}` | PostgreSQL `public.doctors` + `public_doctors` view | Schema & view ready; UI migration pending |
| **Patient Records** | Firestore `patients/{id}` | PostgreSQL `public.patients` | Schema ready; UI migration pending |
| **Appointments** | Firestore `appointments/{id}` | PostgreSQL `public.appointments` | Schema & token triggers ready |
| **Clinical Encounters & Rx** | Embedded in client state / mock | PostgreSQL `encounters` + `prescriptions` | Schema ready |
| **Medical Reports Storage** | Firebase Storage | Supabase Storage (`lab-reports` bucket) | Bucket & policies configured in SQL |
| **Audit Logs** | None (unlogged in V2) | PostgreSQL `record_access_logs` (immutable) | Hardened via security definer trigger |

---

## 6. Authentication & Security Architecture

### 6.1 Role Hierarchy & Promotion Protection
- Roles supported: `patient` (default), `doctor`, `admin`.
- In Supabase schema:
  - Database trigger `trg_protect_profile_role` prevents non-admins from changing their role.
  - New signups default strictly to `patient`.
  - Doctor registration is handled via `register_doctor_candidate()` function; newly registered doctors have `is_verified = false`.
  - Only authenticated `admin` role can update `is_verified`, `verified_at`, and `verified_by`.

### 6.2 Frontend Bundle Security
- `vite.config.ts`: Previously included `'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)`. This must be removed to avoid leaking server-side API keys in client-side bundles.
- Frontend communicates with `/api/ai/analyze` via backend proxy without exposing Gemini API keys.
- Supabase credentials exposed in frontend are restricted exclusively to `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (public anon key). `SUPABASE_SERVICE_ROLE_KEY` is strictly excluded.

---

## 7. Deployment Readiness & Netlify Requirements

### 7.1 Netlify Static Build
- Build command: `npm run build` (`vite build`).
- Output directory: `dist`.
- Node version: `>=18.0.0`.
- Production build passes cleanly with zero TypeScript errors.

### 7.2 Routing Requirements (`netlify.toml`)
Because MediSeba is a client-side SPA with React Router, a Netlify redirect rule is mandatory:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
Without this rule, direct visits or hard refreshes on `/admin`, `/portal`, `/doctors`, or `/dashboard` will result in Netlify 404s.

### 7.3 Backend / API Strategy on Netlify
- On Netlify static hosting, `server.ts` does not execute continuously.
- For AI symptom analysis (`/api/ai/analyze`) and health check (`/api/health`), we can implement:
  - A lightweight Netlify Serverless Function (`netlify/functions/ai-analyze.ts` and `netlify/functions/health.ts`), OR
  - Direct proxying via `netlify.toml` to a deployed FastAPI / Express service.

---

## 8. Prioritized Execution & Integration Roadmap

1. **Step 1 — Repository & Branch Hygiene**:
   - Confirm branch isolation (`main`, `develop/v3`, `feature/v3-supabase`).
   - Create safe snapshot branch `backup/pre-netlify-v3`.
2. **Step 2 — Netlify Deployment Configuration**:
   - Add `netlify.toml` with build commands, output directory, and SPA 200 rewrite rule.
   - Clean up `vite.config.ts` to prevent key bundling.
3. **Step 3 — Dual Portal URL Implementation**:
   - Implement `/admin` route with strict role guard (`role === 'admin'`).
   - Implement `/portal` route acting as smart dispatcher:
     - Unauthenticated -> `/login`
     - `role === 'patient'` -> `/patient/dashboard`
     - `role === 'doctor'` & `is_verified === true` -> `/doctor/dashboard`
     - `role === 'doctor'` & `is_verified === false` -> `/doctor/pending-verification`
     - `role === 'admin'` -> `/admin`
4. **Step 4 — Supabase Staging Database Application**:
   - Push migrations `01` through `05` to staging project `cqcnwpsfmxthfzmuktso`.
   - Seed synthetic Bangladeshi personas and clinical data.
   - Execute Docker-free test runner (`scripts/run-staging-db-tests.mjs`) to verify all 31 security assertions.
5. **Step 5 — CI/CD Pipeline & GitHub-to-Netlify Auto Deploy**:
   - Establish Git continuous deployment from GitHub repo `mohammademon10/MEDISEBA_APP_V2.0`.
6. **Step 6 — Documentation Deliverables**:
   - `docs/DEPLOYMENT_GUIDE.md`
   - `docs/ENVIRONMENT_VARIABLES.md`
   - `docs/PRODUCTION_CHECKLIST.md`
