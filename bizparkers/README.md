# Bizparkers website + admin panel

One small Node.js app that serves:

| URL | What |
|---|---|
| `/` | The Bizparkers website |
| `/admin` | Admin panel: dashboard and analytics, enquiries, pipeline, follow-ups, settings |
| `/api/...` | Enquiry form, privacy-friendly analytics, admin API |

No Google Sheets and no third-party analytics. Everything is stored in your own database.

## Run it on your computer

```bash
cd bizparkers
npm install
cp .env.example .env      # then edit ADMIN_PASSWORD and SESSION_SECRET
npm start                 # http://localhost:3000 and http://localhost:3000/admin
```

## Environment variables

| Variable | Required | What it does |
|---|---|---|
| `ADMIN_EMAIL` | no (default `bizparkers@gmail.com`) | Admin login email |
| `ADMIN_PASSWORD` | **yes** | Admin login password. If missing, a temporary one is printed in the logs at start-up |
| `SESSION_SECRET` | **yes** | Long random string that signs admin logins |
| `DATABASE_URL` | recommended | Postgres URL (Neon, Supabase, Railway, Render). If empty, data is stored in files in `DATA_DIR` |
| `DATA_DIR` | no | Folder for file storage (needs a persistent disk) |
| `TIMEZONE` | no (default `Asia/Kolkata`) | Day boundaries for charts |
| `RESEND_API_KEY`, `NOTIFY_EMAIL`, `NOTIFY_FROM` | no | Email you every new enquiry through resend.com |
| `PORT` | no (default `3000`) | Port to listen on |

To change the admin password later: update `ADMIN_PASSWORD` in your host's settings and restart.

## Deploy

**Railway (simplest, about 5 minutes)**
1. railway.app → New Project → Deploy from GitHub repo → pick this repo.
2. In the service settings set **Root Directory** to `bizparkers`.
3. Add a **PostgreSQL** database (+ New → Database → PostgreSQL).
4. Variables: `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`.
5. Settings → Networking → Generate domain (or add your own domain).

**Render**
1. New → Web Service → connect the repo. Root Directory: `bizparkers`. Build: `npm ci`. Start: `node server.js`.
2. Create a free Postgres (or use Neon) and set `DATABASE_URL`, plus `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`.

**Any VPS or Docker host**
```bash
docker build -t bizparkers ./bizparkers
docker run -d -p 3000:3000 -v bizparkers-data:/app/data \
  -e ADMIN_PASSWORD=... -e SESSION_SECRET=... bizparkers
```

Health check: `GET /healthz`.

## What the admin panel has

- **Dashboard:** visitors, page views, enquiries, conversion rate and time on site (with change vs the previous period), visitors and enquiries per day, live visitors, enquiry-form funnel, traffic sources, devices, visitor locations, most clicked buttons, scroll depth by section, services and budgets people ask for, pipeline value.
- **Enquiries:** search, filters (status, service, starred), sort by date or value, CSV export, record drawer with status, deal value, follow-up date, tags, notes and full activity history, call/email buttons, delete.
- **Pipeline:** drag-and-drop board from New to Won/Lost with deal totals.
- **Follow-ups:** overdue, today, upcoming, and new leads still waiting for a reply.
- **Settings:** edit the website's email, phone, Instagram link, "taking new projects" badge and an announcement bar without touching code.

Security: password login with rate limiting, signed HttpOnly session cookies, CSRF header check, spam honeypot and rate limits on the form, formula-safe CSV export.
