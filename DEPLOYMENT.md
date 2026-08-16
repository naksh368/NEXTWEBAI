# ExpertzTrip — Deployment guide

Production checklist for taking ExpertzTrip live. Everything below is real,
verified against the codebase — no placeholder steps.

> Verified before writing this guide: `tsc --noEmit` clean · `next lint` clean ·
> `npm test` 8/8 pass · `next build` succeeds (39 routes).

---

## 1. Prerequisites

- Node.js 18.18+ (Next.js 15 requirement)
- A PostgreSQL database (Neon, Supabase, RDS, Railway … any managed Postgres)
- Accounts: **MSG91** (SMS/OTP), **Resend** (email), **Razorpay** (payments)

---

## 2. Environment variables

Copy `.env.example` → `.env` (or set these in your host's dashboard — on Vercel:
*Project → Settings → Environment Variables*). None of these live in the repo.

| Variable | Required | Notes |
|---|---|---|
| `AUTH_SECRET` | ✅ | 32+ random chars. Signs sessions + OTP tokens. |
| `DATABASE_URL` | ✅ | Your Postgres connection string (see §3). |
| `NEXT_PUBLIC_SITE_URL` | ✅ | e.g. `https://expertztrip.com`. Used in emails/links/SEO. |
| `SMS_PROVIDER` | ✅ | Set to `msg91` in prod. |
| `MSG91_AUTH_KEY` | ✅ | Your MSG91 auth key. |
| `SMS_SENDER_ID` | ✅ | DLT sender header, max 6 chars. |
| `MSG91_OTP_TEMPLATE_ID` | ✅ | DLT template for login/registration OTP. |
| `MSG91_WELCOME_TEMPLATE_ID` | ➖ | Welcome SMS after verification. |
| `MSG91_TXN_TEMPLATE_ID` | ➖ | Booking/document/itinerary alert SMS. |
| `EMAIL_PROVIDER` | ✅ | Set to `resend` in prod. |
| `EMAIL_API_KEY` | ✅ | Resend API key (`re_…`). |
| `EMAIL_FROM` | ✅ | `ExpertzTrip <notifications@yourdomain.com>` (verified domain). |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | ✅ | Public key id (browser-safe). |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | ✅ | Server keys. |
| `RAZORPAY_WEBHOOK_SECRET` | ➖ | Enables the payment webhook (recommended). |
| `AI_API_KEY` | ➖ | OpenAI/OpenRouter key. Without it, AI falls back to grounded keyword search. |
| `AI_PROVIDER` / `AI_MODEL` / `AI_BASE_URL` | ➖ | Defaults target OpenAI-compatible gateways. |

**To change any of these later:** edit the value in the host dashboard and
redeploy/restart. No code change needed to rotate keys or swap a provider.

---

## 3. Database (switch SQLite → PostgreSQL)

Local dev uses SQLite for zero setup. For production, make two edits and push:

1. In `prisma/schema.prisma`, set the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
2. Point `DATABASE_URL` at your Postgres instance.
3. Create the schema and seed the catalogue + admin:
   ```bash
   npx prisma db push        # creates all tables (no migrations dir in use)
   npm run db:seed           # 50 packages, roles/permissions, Super Admin
   ```

All models use only Postgres-portable types (String/Int/Boolean/DateTime/Json),
so no data-type changes are required.

---

## 4. Provider setup

### MSG91 (SMS + OTP) — India DLT
MSG91 cannot send any SMS without DLT-approved templates. In the MSG91 console:
1. Register your sender id and create DLT templates.
2. Put their ids in `MSG91_OTP_TEMPLATE_ID`, `MSG91_WELCOME_TEMPLATE_ID`,
   `MSG91_TXN_TEMPLATE_ID`.
3. Set `SMS_PROVIDER=msg91`.

Until a template id is present, the matching SMS is **honestly skipped** (logged
as `SKIPPED` in `MessageLog`) — never faked.

### Resend (email)
1. Add and **verify your sending domain** in Resend.
2. Set `EMAIL_FROM` to an address on that domain.
   > Before the domain is verified, Resend's `onboarding@resend.dev` sender only
   > delivers to your own account email — real customers won't receive mail.
3. Set `EMAIL_PROVIDER=resend` and `EMAIL_API_KEY`.

### Razorpay (payments)
1. Set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
2. (Recommended) Add a webhook pointing at `/api/webhooks/razorpay` and set
   `RAZORPAY_WEBHOOK_SECRET`. Server-side signature verification is always on;
   without the webhook, payment success still relies on the verified client
   callback (`/api/payments/razorpay/verify`).

---

## 5. Admin access

- Admin login is **phone + OTP** (no password). The seeded Super Admin mobile is
  **+91 8700650467**.
- The admin sets their name/email on first login.
- To add more admins later, use the admin panel (or seed additional
  `AdminUser` rows with the appropriate role).

---

## 6. Build & run

```bash
npm ci
npm run build      # runs `prisma generate && next build`
npm start          # or deploy to Vercel (build command is automatic)
```

On Vercel: set the env vars, connect the repo, and deploy. The build command
already generates the Prisma client.

---

## 7. Post-deploy smoke test

- [ ] Home, packages, package detail, destinations pages load.
- [ ] Customer OTP login works (real SMS received).
- [ ] Admin OTP login works on **+91 8700650467**.
- [ ] Create a booking → Razorpay checkout → payment verified.
- [ ] After payment: customer gets in-app + email + SMS ("payment received").
- [ ] Admin uploads a document → customer gets "document ready" notification.
- [ ] Notification center shows unread count; "mark all read" works.
- [ ] AI assistant answers from real packages only.

---

_Real packages · clear pricing · expert support._
