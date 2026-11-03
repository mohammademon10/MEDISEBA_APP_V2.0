# MediSeba V3 (MediSeba Connect) — Deployment Guide

**Target Audience:** DevOps Engineers, Full-Stack Engineers, System Administrators  
**Project:** MediSeba Connect (*One Patient. One Health Record. Connected Care.*)  
**Repository:** [https://github.com/mohammademon10/MEDISEBA_APP_V2.0](https://github.com/mohammademon10/MEDISEBA_APP_V2.0)

---

## 1. Architecture Overview

MediSeba Connect runs on a modern, decoupled cloud architecture:

```
+-------------------------------------------------------------------+
|                        GITHUB REPOSITORY                          |
|                 mohammademon10/MEDISEBA_APP_V2.0                  |
|          Branches: main (prod) | develop/v3 | feature/*           |
+---------------------------------+---------------------------------+
                                  | Automatic Git Webhook / CI
                                  v
+-------------------------------------------------------------------+
|                         NETLIFY (EDGE)                            |
|  - Build Command: npm run build                                   |
|  - Publish Dir: dist                                              |
|  - SPA Redirects: /* -> /index.html (200)                         |
|  - Security Headers: HSTS, X-Frame-Options, CSP                   |
+------------------+------------------------------+-----------------+
                   |                              |
      Portal 1: /admin              Portal 2: /portal
   (Restricted Admin Access)    (Doctor & Patient Shared Gateway)
                   |                              |
                   +--------------+---------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                     SUPABASE POSTGRESQL (CLOUD)                   |
|  - Project: cqcnwpsfmxthfzmuktso                                  |
|  - 12 Relational Tables with Row-Level Security (RLS)             |
|  - Immutable Audit Logging (log_record_access)                    |
|  - Doctor Candidate Protection Trigger                            |
|  - Private Storage Bucket: lab-reports                            |
+-------------------------------------------------------------------+
```

---

## 2. GitHub Branch & Release Workflow

MediSeba uses a strict, safe Git branching strategy:

1. **`main` (Production Branch)**:
   - Contains only thoroughly verified, production-ready code.
   - Connected directly to Netlify's production deployment environment.
   - Pushes to `main` should only occur via approved Pull Requests from `develop/v3`.
2. **`develop/v3` (Integration Branch)**:
   - Staging and integration branch for V3 features.
   - Feature branches merge here after local verification (`npm run lint && npm run build`).
3. **`feature/*` (Feature Development)**:
   - Isolated branches for specific tasks (e.g. `feature/v3-supabase`, `feature/v3-security`).
   - Generates Netlify Deploy Previews when a Pull Request is opened against GitHub.
4. **`release/v2-stable` & `backup/*`**:
   - Snapshot recovery branches. Never delete or overwrite.

---

## 3. Netlify Continuous Deployment Setup

### 3.1 Initial Repository Connection
1. Log in to [Netlify](https://app.netlify.com).
2. Click **Add new site** ➔ **Import an existing project**.
3. Select **GitHub** and authorize access to repository:
   `mohammademon10/MEDISEBA_APP_V2.0`
4. Set Build Configuration:
   - **Base directory:** *(leave blank for root)*
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Production branch:** `main`

### 3.2 Automated Single-Page Application (SPA) Routing
MediSeba uses React Router DOM. Without explicit server routing, reloading on deep links like `/admin` or `/portal` returns a 404.
This is resolved in [`netlify.toml`](file:///C:/Users/EMON/.gemini/antigravity/scratch/MEDISEBA_APP_V2.0/netlify.toml):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3.3 Production Environment Variables in Netlify
In Netlify Dashboard: **Site configuration** ➔ **Environment variables** ➔ **Add a variable**:
- `VITE_SUPABASE_URL`: `https://cqcnwpsfmxthfzmuktso.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_F6K4KzB0HxNsngc6L7RgRg_D05BXDxe`

*(Note: Never add `SUPABASE_SERVICE_ROLE_KEY` or database passwords to Netlify frontend build variables).*

---

## 4. Supabase Database Deployment

### 4.1 Target Project
- **Project Ref:** `cqcnwpsfmxthfzmuktso`
- **Dashboard URL:** `https://supabase.com/dashboard/project/cqcnwpsfmxthfzmuktso`

### 4.2 Migration Pipeline (`supabase/migrations/`)
The database contains 5 incremental SQL migrations:
1. `20261103000001_core_schema.sql`: 12 core tables, foreign keys, and indexes.
2. `20261103000002_functions_and_views.sql`: Role resolution, consent verification, and audit triggers.
3. `20261103000003_rls_policies.sql`: Comprehensive Row-Level Security rules.
4. `20261103000004_storage_and_grants.sql`: Storage bucket `lab-reports` and explicit table grants.
5. `20261103000005_security_hardening.sql`: Immutable audit logs, doctor candidate registration security, and appointment mutation constraints.

### 4.3 Running Docker-Free Database Tests
Execute the custom staging database test runner:
```bash
node scripts/run-staging-db-tests.mjs
```
This runs all 31 security assertions without requiring Docker Desktop.

---

## 5. Portal Access URLs & Verification

Once deployed on Netlify, the application provides two primary portals:

| Portal | URL Path | Authorization Requirement | Destination |
| :--- | :--- | :--- | :--- |
| **Admin Portal** | `/admin` | Verified `role === 'admin'` only. Public registration denied. | Full administrative operations hub, doctor verification, patient directory, and audit logs. |
| **Doctor & Patient Portal** | `/portal` | Shared gateway for verified doctors and registered patients. | Automatically routes to `/doctor/dashboard` (or `/doctor/pending-verification`) or `/patient/dashboard`. |
| **Doctor Dashboard** | `/doctor/dashboard` | Verified doctor credentials (`is_verified = true`). | Clinical queue, appointment status updates. |
| **Doctor Pending Review** | `/doctor/pending-verification` | Doctor signed up but unverified. | Official BMDC review notice with helpline. |
| **Patient Dashboard** | `/patient/dashboard` | Registered patient. | Unified Health Passport ID, consultation history, doctor booking. |

---

## 6. AI Symptoms Assistant Deployment Note

The `/api/ai/analyze` symptom assistant runs on Google Gemini 1.5 Pro.
- In local development, Express (`server.ts`) proxies requests to Gemini using server-side credentials.
- On Netlify production, API keys are kept strictly off the client bundle. Symptom requests can be handled via Netlify Serverless Functions (`netlify/functions/ai-analyze.ts`) or directed to an external backend service (FastAPI/Express).
