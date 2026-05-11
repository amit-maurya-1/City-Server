# CityServe — Frontend Setup Guide

React + Vite + Tailwind CSS
Deployed on Vercel (free tier works perfectly)

---

## Folder Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json              ← Vercel deployment config
├── .env.example             ← Copy this to .env and fill values
└── src/
    ├── App.jsx              ← Routes + providers
    ├── main.jsx             ← Entry point
    ├── index.css            ← Global styles + Tailwind
    ├── lib/
    │   ├── supabase.js      ← Supabase client (singleton)
    │   └── constants.js     ← All magic values in one place
    ├── contexts/
    │   └── AuthContext.jsx  ← Global auth state (user, role, city)
    ├── hooks/
    │   ├── useGeolocation.js ← Browser GPS wrapper
    │   └── useIssues.js     ← Fetch city-scoped issues
    ├── services/
    │   ├── authService.js   ← Login, register, cities
    │   ├── issueService.js  ← Submit, fetch, upvote issues
    │   ├── adminService.js  ← Admin dashboard operations
    │   └── aiService.js     ← Calls AI Edge Function
    ├── pages/
    │   ├── MapPage.jsx       ← Public map (/)
    │   ├── ReportPage.jsx    ← Submit issue (/report)
    │   ├── IssueDetailPage.jsx ← Full issue view (/issues/:id)
    │   ├── AdminPage.jsx     ← Admin dashboard (/admin)
    │   ├── LoginPage.jsx     ← Login (/login)
    │   ├── RegisterPage.jsx  ← Register (/register)
    │   └── NotFoundPage.jsx  ← 404
    └── components/
        ├── admin/           ← StatsCards, StatusDropdown, IssueRow
        ├── issues/          ← DuplicateWarning, LocationPicker
        ├── layout/          ← Navbar, ProtectedRoute
        ├── map/             ← LeafletMap, IssuePopup, MapFilters
        └── ui/              ← Badge (status + severity)
```

---

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- Backend setup MUST be done first (see backend/README.md)

Check your versions:
```bash
node -v   # should be 18+
npm -v    # should be 9+
```

---

## Step 1 — Install Dependencies

```bash
cd frontend
npm install
npm install -D tailwindcss autoprefixer
```

---

## Step 2 — Create .env File

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_FUNCTIONS_URL=https://your-project.supabase.co/functions/v1
```

Get these from: Supabase Dashboard → Settings → API

> NEVER commit your .env file. It's already in .gitignore.

---

## Step 3 — Run Locally

```bash
npm run dev
```

Open: http://localhost:3000

---

## Step 4 — Test the App

### As a Public User (no login):
1. Open http://localhost:3000
2. Select a city from the filter panel (top-left)
3. Browse issues on the map
4. Click any marker to see the popup
5. Click "View full report" for issue detail

### As a Citizen:
1. Go to /register
2. Fill in name, email, password, city
3. Leave "Register as Admin" unchecked
4. After login → you land on the map
5. Click "Report Issue" button
6. Fill 3-step form: Description + Image → Location → Review
7. Submit — AI will categorize it in a few seconds

### As an Admin:
1. Go to /register
2. Check "Register as Admin"
3. Enter the ADMIN_SECRET_CODE you set in the Edge Function
4. After login → you land on /admin dashboard
5. See stats, filter issues, update status via dropdown

---

## Step 5 — Deploy to Vercel

### Option A: Vercel CLI
```bash
npm install -g vercel
vercel
```
Follow the prompts. It auto-detects Vite.

### Option B: Vercel Dashboard
1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Set Root Directory to: `frontend`
5. Add environment variables (same 3 from your .env)
6. Click Deploy

> vercel.json is already configured for React Router (SPA rewrites + security headers).

---

## Environment Variables Reference

| Variable                      | Required | Description                        |
|-------------------------------|----------|------------------------------------|
| VITE_SUPABASE_URL             | ✅ Yes   | Your Supabase project URL          |
| VITE_SUPABASE_ANON_KEY        | ✅ Yes   | Supabase anon (public) key         |
| VITE_SUPABASE_FUNCTIONS_URL   | ✅ Yes   | Edge Functions base URL            |

---

## Common Issues & Fixes

### Map doesn't show / white screen
- Check browser console for errors
- Confirm VITE_SUPABASE_URL is correct
- Make sure SQL files were run in Supabase

### GPS not working
- Browser asks for location permission — allow it
- On localhost, some browsers block GPS. Use HTTPS or use the manual map pin instead.

### Images not loading after upload
- Make sure "issue-images" bucket is set to PUBLIC in Supabase Storage
- Check storage policies were applied (03_storage_policies.sql)

### Admin registration fails
- Make sure register-admin Edge Function is deployed
- Make sure ADMIN_SECRET_CODE secret is set in Edge Function secrets
- Check Edge Function logs: Supabase Dashboard → Edge Functions → Logs

### AI category/severity showing as null
- Check analyze-issue Edge Function is deployed
- Make sure ANTHROPIC_API_KEY secret is set
- This is non-blocking — issues still save with null values if AI is down

### "relation does not exist" error
- SQL files were not run, or ran out of order
- Run them again in order: 01 → 02 → 03

---

## Page Routes

| Route        | Who can access       | What it does                    |
|--------------|---------------------|---------------------------------|
| /            | Everyone            | Public map with issue markers   |
| /login       | Unauthenticated     | Login form                      |
| /register    | Unauthenticated     | Registration form               |
| /report      | Citizens only       | 3-step issue submission form    |
| /issues/:id  | Everyone            | Full issue detail + upvote      |
| /admin       | Admins only         | Dashboard + issue management    |
