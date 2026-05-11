# CityServe — Backend Setup Guide

Backend = Supabase (PostgreSQL + Auth + Storage + Edge Functions)
No separate server needed. Everything runs on Supabase.

---

## Folder Structure

```
backend/
├── supabase/
│   ├── sql/
│   │   ├── 01_schema.sql          ← Tables, indexes, triggers
│   │   ├── 02_rls_policies.sql    ← Row Level Security policies
│   │   └── 03_storage_policies.sql ← Image upload policies
│   └── functions/
│       ├── analyze-issue/         ← Claude AI calls (server-side)
│       └── register-admin/        ← Admin secret code validation
```

---

## Step 1 — Create Supabase Project

1. Go to https://supabase.com and create a free account
2. Click "New Project" — give it a name and set a DB password
3. Wait for the project to finish provisioning (~1 min)

---

## Step 2 — Run SQL Files (in order)

Go to: Supabase Dashboard → SQL Editor → New Query

Run each file in this EXACT order:

### Run 01_schema.sql first
- Creates: cities, profiles, issues, upvotes tables
- Creates: all indexes, triggers, helper functions
- Seeds: 8 starter cities (Delhi, Mumbai, Bangalore, etc.)

### Run 02_rls_policies.sql second
- Enables Row Level Security on all tables
- Sets up city-scoped access for citizens and admins

### Run 03_storage_policies.sql third
- Sets up image upload/read permissions

> Copy the contents of each file, paste into SQL Editor, click Run.

---

## Step 3 — Create Storage Bucket

Go to: Supabase Dashboard → Storage → New Bucket

Settings:
  Name:              issue-images
  Public:            ✅ YES (images must be publicly viewable on the map)
  Max file size:     5242880  (= 5MB)
  Allowed MIME types: image/jpeg, image/png, image/webp

---

## Step 4 — Deploy Edge Functions

Install Supabase CLI:
```bash
npm install -g supabase
```

Login and link to your project:
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```
(Project ref is in: Dashboard → Settings → General → Reference ID)

Deploy both functions:
```bash
supabase functions deploy analyze-issue
supabase functions deploy register-admin
```

---

## Step 5 — Set Edge Function Secrets

Go to: Supabase Dashboard → Edge Functions → click each function → Secrets

### analyze-issue secrets:
| Key                | Value                        |
|--------------------|------------------------------|
| ANTHROPIC_API_KEY  | sk-ant-... (from anthropic.com/api) |

### register-admin secrets:
| Key                       | Value                            |
|---------------------------|----------------------------------|
| ADMIN_SECRET_CODE         | choose-any-strong-secret-string  |
| SUPABASE_URL              | https://your-project.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | your-service-role-key            |

> Service role key: Dashboard → Settings → API → service_role (secret)

---

## Step 6 — Note Your API Keys (needed for frontend .env)

From Supabase Dashboard → Settings → API:

  Project URL:     https://your-project.supabase.co
  anon/public key: eyJ... (long string)

---

## Verification Checklist

- [ ] All 3 SQL files ran without errors
- [ ] Storage bucket "issue-images" created and public
- [ ] Both Edge Functions show as "Active" in dashboard
- [ ] Both functions have their secrets set
- [ ] You have your Project URL and anon key ready

---

## What Each Piece Does

| File                  | Purpose                                              |
|-----------------------|------------------------------------------------------|
| 01_schema.sql         | Creates DB structure — tables, indexes, 6 triggers   |
| 02_rls_policies.sql   | Security — who can read/write what                   |
| 03_storage_policies.sql | Image upload security                              |
| analyze-issue/        | Runs Claude AI server-side (categorize, severity, duplicate check) |
| register-admin/       | Validates admin secret code server-side              |
