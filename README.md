# CityServe — Civic Issue Reporting Platform

> Report potholes. Track garbage. Fix your city.

CityServe is a web app that lets citizens report local civic problems — potholes, water leaks, broken streetlights, garbage overflow — using a photo and their GPS location. Municipal admins get a dashboard to verify issues, update their status, and track how long resolution takes. Everyone else can browse reported issues on a live map without even logging in.

Built for Indian cities. Works for any city.

---

## Why this exists

Most cities have no real channel between residents and the people responsible for fixing things. Government portals exist, but they're slow, hard to use, and give zero visibility into what's happening with your complaint. CityServe is the thing that should have existed already — report in 30 seconds, see it on the map, watch it get resolved.

---

## What it does

**For citizens**
- Report an issue with a photo, description, and GPS pin
- AI automatically assigns a category (roads, garbage, water, lighting) and severity (low / medium / high)
- If something similar was already reported nearby, the app warns you and links to the existing report
- Upvote issues other citizens reported to show priority
- Track your report through its full lifecycle

**For admins**
- City-scoped dashboard — only see issues in your city
- Update issue status: Reported → Verified → In Progress → Resolved
- Filter and search by category, severity, status
- See resolution time automatically tracked per issue
- Soft-delete spam or false reports (never hard-deleted, audit trail stays)

**For everyone**
- Interactive map with color-coded issue markers
- Filter by city, status, category
- No login needed to browse

---

## Tech stack

| Layer | What |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Supabase — PostgreSQL + Auth + Storage |
| Geo queries | PostGIS extension on Supabase |
| Maps | Leaflet.js + OpenStreetMap |
| AI | Claude API (Anthropic) via Supabase Edge Functions |
| Deployment | Vercel (frontend) + Supabase managed cloud |

The Claude API key never touches the frontend. All AI calls go through a Supabase Edge Function. Same for admin secret code validation — server-side only.

---

## Project structure

```
CityServe/
├── backend/
│   └── supabase/
│       ├── sql/
│       │   ├── 01_schema.sql          # Tables, indexes, triggers, PostGIS
│       │   ├── 02_rls_policies.sql    # Row Level Security
│       │   └── 03_storage_policies.sql
│       └── functions/
│           ├── analyze-issue/         # Claude API — categorize + duplicate check
│           └── register-admin/        # Admin secret code validation
│
└── frontend/
    └── src/
        ├── components/
        │   ├── admin/        # StatsCards, StatusDropdown, IssueRow
        │   ├── issues/       # DuplicateWarning, LocationPicker
        │   ├── layout/       # Navbar, ProtectedRoute
        │   ├── map/          # LeafletMap, IssuePopup, MapFilters
        │   └── ui/           # Badge
        ├── contexts/         # AuthContext — global auth state
        ├── hooks/            # useGeolocation, useIssues
        ├── lib/              # Supabase client, constants
        ├── pages/            # MapPage, ReportPage, AdminPage, etc.
        └── services/         # authService, issueService, adminService, aiService
```

---

## Setup

### Backend first

1. Create a project at [supabase.com](https://supabase.com)

2. Run these SQL files in order in the Supabase SQL Editor:
   ```
   backend/supabase/sql/01_schema.sql
   backend/supabase/sql/02_rls_policies.sql
   backend/supabase/sql/03_storage_policies.sql
   ```

3. Create a Storage bucket named `issue-images` — set it to **public**

4. Deploy the Edge Functions:
   ```bash
   supabase functions deploy analyze-issue --project-ref YOUR_REF
   supabase functions deploy register-admin --project-ref YOUR_REF
   ```

5. Set secrets in Supabase Dashboard → Edge Functions → Secrets:

   For `analyze-issue`:
   ```
   ANTHROPIC_API_KEY = sk-ant-...
   ```

   For `register-admin`:
   ```
   ADMIN_SECRET_CODE = your-chosen-secret
   SUPABASE_URL = https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
   ```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Open `http://localhost:3000`

---

## Environment variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_SUPABASE_FUNCTIONS_URL=https://your-project.supabase.co/functions/v1
```

Get these from: Supabase Dashboard → Settings → API Keys

---

## How user roles work

| Role | Access |
|---|---|
| Public | View map, browse issues — no login needed |
| Citizen | Report issues, upvote, track status |
| Admin | Manage issues in their city only — update status, delete, see stats |

City scoping is enforced at the database level via Row Level Security. An admin in Delhi cannot read Mumbai's data — even if they try directly through the API.

Admin accounts are created via a secret code that only the platform owner knows. That code is validated server-side — it's never exposed in the JavaScript bundle.

---

## Pages

| Route | Who can access | What it does |
|---|---|---|
| `/` | Everyone | Map with all reported issues |
| `/report` | Citizens | 3-step issue submission form |
| `/issues/:id` | Everyone | Full issue detail + upvote |
| `/admin` | Admins | Dashboard — stats, filters, status updates |
| `/login` | Anyone | Login |
| `/register` | Anyone | Register as citizen or admin |

---

## How the AI works

When a citizen submits a report:

1. The description goes to Claude via an Edge Function
2. Claude returns a category, severity level, and a short auto-generated title
3. The app then fetches existing issues within 500m using PostGIS
4. If any are found, Claude does a semantic comparison — not just keyword matching
5. If it's a duplicate, the citizen sees a warning with a link to the existing issue
6. They can dismiss it and submit anyway, or upvote the existing one instead

If Claude is down or slow, the issue saves anyway with `null` for category and severity. Reporting never gets blocked by AI availability.

---

## Security decisions worth noting

- RLS on every table — city-scoped at the DB level, not just the app level
- Claude API key lives only in Edge Function secrets
- Admin secret code validated server-side — not in the JS bundle
- Image paths follow `{userId}/{filename}` convention for ownership tracking
- Soft deletes only — civic data is never hard-deleted
- Rate limiting: 5-minute cooldown between reports per user
- Upvote uniqueness enforced by a DB constraint, not just application logic



## 🤝 Contributing

Contributions are welcome! If you'd like to improve this project:

Please keep code clean, well-commented, and consistent with the existing style. For major changes, open an issue first to discuss your proposal.

---

## 📄 Contact

Feel free to connect with me on [LinkedIn](https://www.linkedin.com/in/amit-kumar-maurya-b23281253) or reach out if you have questions or feedback!
Test update from responsiveness branch
