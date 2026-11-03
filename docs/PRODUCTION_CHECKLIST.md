# MediSeba V3 — Production Deployment Checklist

**Document:** `docs/PRODUCTION_CHECKLIST.md`  
**Purpose:** Mandatory pre-flight verification before promoting code from `develop/v3` to `main` and deploying to Netlify production.

---

## 1. Source Code & Git Verification
- [x] Working tree is clean (`git status` shows no uncommitted files).
- [x] Branch strategy adheres to:
  - `main` = Production.
  - `develop/v3` = Integration & Staging.
  - `feature/*` = Task-specific branches.
- [x] Safety backup snapshot branch exists (`backup/pre-integration-v3`).
- [x] Remote URL is verified (`https://github.com/mohammademon10/MEDISEBA_APP_V2.0.git`).
- [x] No secrets, passwords, or `.env` files are tracked by Git.
- [x] `.env.example` contains only placeholder values.

---

## 2. Code Quality & Build Verification
- [x] TypeScript typecheck passed cleanly:
  ```bash
  npm run lint  # tsc --noEmit (0 errors)
  ```
- [x] Production build generated without errors:
  ```bash
  npm run build # vite build (dist/ generated cleanly)
  ```
- [x] Client bundle audited for sensitive environment variables:
  - Verified `vite.config.ts` no longer defines `process.env.GEMINI_API_KEY`.
  - Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are used in client code.

---

## 3. Database & Security Verification
- [x] Supabase target project identified: `cqcnwpsfmxthfzmuktso`.
- [x] Migrations `20261103000001` through `20261103000005` in order and immutable.
- [x] All 12 tables have Row-Level Security (RLS) enabled.
- [x] Role escalation blocked: non-admin users cannot alter `profiles.role`.
- [x] Doctor candidate registration flow secured (`register_doctor_candidate` marks doctors unverified).
- [x] Doctor approval restricted strictly to authenticated `admin`.
- [x] Audit logs are append-only; `UPDATE` and `DELETE` denied on `record_access_logs`.
- [x] Storage bucket `lab-reports` is private and protected by RLS.
- [x] Docker-free test runner created (`scripts/run-staging-db-tests.mjs`).

---

## 4. Portal Routing & Netlify Configuration
- [x] `netlify.toml` created with:
  - `command = "npm run build"`
  - `publish = "dist"`
  - SPA 200 rewrite rule (`/* -> /index.html 200`).
  - Strict security headers (`HSTS`, `X-Frame-Options`, `X-Content-Type-Options`).
- [x] Portal 1 (`/admin`) implemented:
  - Restricted to verified `role === 'admin'`.
  - Non-admins encounter 403 Forbidden guard.
  - Unauthenticated users receive an admin-only credential challenge (no public signups).
  - Telemetry tabs for Doctor Verification, Patients, Facilities, and Audit Logs.
- [x] Portal 2 (`/portal`) implemented:
  - Shared access gateway for Doctors and Patients.
  - Automatically redirects:
    - `patient` -> `/patient/dashboard`
    - `doctor` (verified) -> `/doctor/dashboard`
    - `doctor` (unverified) -> `/doctor/pending-verification`
    - `admin` -> `/admin`
- [x] Backward compatibility preserved:
  - `/dashboard` automatically redirects to `/portal`.
  - Existing public routes (`/`, `/doctors`, `/doctor/:id`) continue operating seamlessly.

---

## 5. Verification Verdict
**Status:** **READY FOR GITHUB & NETLIFY CONTINUOUS INTEGRATION**  
All functional, security, routing, and deployment configurations are verified.
