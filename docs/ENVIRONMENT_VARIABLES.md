# MediSeba V3 — Environment Variables Reference

**Document:** `docs/ENVIRONMENT_VARIABLES.md`  
**Security Classification:** Confidential Internal Reference

---

## 1. Frontend Environment Variables (Netlify & Client SPA)

These variables are prefixed with `VITE_` and are bundled into the client-side JavaScript. **Never place secrets, private tokens, or service role keys here.**

| Variable Name | Required | Safe for Client? | Purpose | Example Value |
| :--- | :---: | :---: | :--- | :--- |
| `VITE_SUPABASE_URL` | **Yes** | Yes | Public Supabase project API gateway endpoint. | `https://cqcnwpsfmxthfzmuktso.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Yes** | Yes | Supabase public anonymous/publishable key. Protected by RLS policies on the database. | `sb_publishable_F6K4KzB0HxNsngc6L7RgRg_D05BXDxe` |

---

## 2. Server / Backend Environment Variables (Private & Restricted)

These variables are consumed **exclusively on the server-side** (e.g. Express server, Netlify Functions, or FastAPI). They must **never** be exposed in client code, Git commits, or Netlify frontend build variables.

| Variable Name | Required | Location | Purpose | Example / Format |
| :--- | :---: | :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | Server runtime only (`server.ts` or Netlify function) | Google Generative AI API Key for symptom explanations. | `AIzaSy...` |
| `MEDISEBA_STAGING_DATABASE_URL` | Development/CI | Local `.env.staging` (gitignored) | Direct or Pooler PostgreSQL connection string for pgTAP tests and migrations. | `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require` |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged backend only | Secure backend env only | Bypass RLS for authorized admin batch tasks. **NEVER add to frontend.** | `eyJhbGciOi...` |
| `PORT` | Optional | Server runtime (`server.ts`) | Port for backend service execution. | `3000` |

---

## 3. Configuration in Netlify Dashboard

When configuring Netlify Continuous Deployment:
1. Navigate to: **Site settings** ➔ **Build & deploy** ➔ **Environment**.
2. Add only:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. If using Netlify Serverless Functions for AI Analysis:
   - Add `GEMINI_API_KEY` under the **Functions** scope only (not available to frontend bundle).

---

## 4. Git Protection Rules

The repository's `.gitignore` contains:
```gitignore
.env*
!.env.example
```
- Any file matching `.env`, `.env.local`, `.env.staging`, or `.env.production` is automatically excluded from Git commits.
- `.env.example` contains placeholder strings only.
