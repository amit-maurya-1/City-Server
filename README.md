# CityServe — Civic Issue Reporting Platform

Citizens report local problems. Admins resolve them.

---

## Quick Start

```
STEP 1 → Read and follow:  backend/README.md   (Supabase setup)
STEP 2 → Read and follow:  frontend/README.md  (React setup + run)
```

---

## Project Structure

```
CityServe-Final/
├── backend/               ← Supabase SQL + Edge Functions
│   └── supabase/
│       ├── sql/           ← Run these 3 files in Supabase SQL Editor
│       └── functions/     ← Deploy these 2 Edge Functions
│
└── frontend/              ← React app (Vite + Tailwind)
    ├── src/
    └── ...
```

---

## Tech Stack

  Frontend   →  React 18 + Vite + Tailwind CSS
  Backend    →  Supabase (Auth + PostgreSQL + Storage)
  Maps       →  Leaflet + OpenStreetMap (free, no API key)
  AI         →  Claude API via Supabase Edge Functions
  Deployment →  Vercel (frontend) + Supabase (backend)

---

## Three User Roles

  Public   →  Browse issues on the map (no login)
  Citizen  →  Report issues, upvote, view details
  Admin    →  Manage issues, update status, see stats

---

## Key Features Built

  ✅ Multi-city support with city-scoped data
  ✅ AI categorization + severity estimation (Claude)
  ✅ AI duplicate detection within 500m radius
  ✅ GPS auto-detect + manual map pin fallback
  ✅ Image upload with preview + validation
  ✅ 3-step issue submission form
  ✅ Color-coded interactive map (status-based)
  ✅ Admin dashboard with stats + filters + sort
  ✅ Inline status update (Reported → Resolved)
  ✅ Resolution time tracking
  ✅ Soft delete with restore
  ✅ Upvote system (one per user, DB trigger synced)
  ✅ Rate limiting (5 min cooldown between reports)
  ✅ Row Level Security on all tables
  ✅ Admin secret code validated server-side (Edge Function)
  ✅ Claude API key server-side only (Edge Function)
  ✅ Graceful AI fallback (issues save even if Claude is down)
