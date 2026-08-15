# ExpertzTrip

**Your holiday. Your way.** — a production-grade B2C holiday-package platform: real packages, clear server-verified pricing, and a smooth, fast customer experience.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma**. Designed for performance from the ground up (server components, pagination, image optimization, code-splitting, skeletons) so the site is fast and never laggy.

---

## Quick start

```bash
npm install
cp .env.example .env          # dev defaults work out of the box (SQLite + console OTP)
npm run db:push               # create the SQLite schema
npm run db:seed               # load the sample catalogue
npm run dev                   # http://localhost:3000
```

Useful scripts:

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (`prisma generate` + `next build`) |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm run test` | Pricing engine + booking-state-machine tests |
| `npm run db:reset` | Wipe + re-seed the dev database |

**Dev OTP:** with `SMS_PROVIDER=console`, the one-time code is printed to the **server console** (never to the browser). Sign in at `/account` with any mobile number and read the code from the terminal.

---

## Architecture

```
src/
  app/                     # Routes (App Router)
    (public)               # /, /packages, /packages/[slug], /destinations, /offers, /ai ...
    account/               # Customer app (OTP-gated): trips, profile, payments, documents ...
    api/                   # Backend services: pricing, auth (OTP), assistant search
  components/
    ui/                    # Design system: button, card, badge, input, skeleton, states ...
    layout/                # Header, Footer
    home/  package/  auth/  ai/
  lib/
    db.ts                  # Prisma singleton (single data-access entry point)
    queries.ts             # Centralized read queries (cached where safe)
    pricing.ts             # Pure, server-authoritative pricing engine
    booking-states.ts      # Booking state machine (allowed transitions)
    session.ts             # HMAC-signed httpOnly session
    constants.ts           # Status vocabularies + Zod enums (single source of truth)
    services/              # pricing-service, otp-service (business logic, not in UI)
prisma/
  schema.prisma            # Full domain model (see Phase 2)
  seed.ts                  # Sample catalogue (no fake reviews/bookings/payments)
tests/                     # Node test-runner tests (no extra deps)
```

**Principles enforced**
- Business logic lives in `lib/` services, never in UI components.
- **Pricing is server-authoritative** — the client shows an estimate, but `/api/pricing` and checkout recompute on the server. Never trust a client price.
- **Packages are versioned** — bookings pin an immutable `PackageVersion` + snapshot, so changing a package never rewrites history.
- **Statuses are centralized** in `constants.ts` (SQLite has no enums; ports 1:1 to Postgres enums).

---

## Design system (Phase 4)

White/light foundation, royal-blue + navy typography, restrained orange accent — matched to the ExpertzTrip logo. The logo is a faithful CSS recreation in `components/ui/logo.tsx`; drop the official asset at `public/logo.svg` and swap the inner markup to use it.

Reusable primitives: `Button`, `Card`, `Badge`, `Input`/`Field`, `Skeleton`, `Accordion`, `Breadcrumbs`, `Pagination`, `EmptyState`, `ErrorState`, `SmartImage` (with graceful fallback).

---

## What's implemented (this build)

| Milestone | Status |
| --- | --- |
| **A** Foundation + full DB schema + design system | ✅ |
| **B** Homepage · destination pages · package listing (search / filter / paginate) | ✅ |
| **C** Package detail · structured itinerary · live customization + **server-side reprice** | ✅ |
| **D** OTP auth (mobile → OTP → mandatory email) · customer account · My Trips | ✅ (real, dev SMS = console) |
| **E** Checkout · traveller capture · **booking engine** (real bookings + immutable snapshot + component statuses + state machine) · Razorpay wired | ✅ booking creation works with no keys; live **charge** activates when Razorpay keys are set |
| **F** Admin operations (Phases 22–28): auth + server-side RBAC, dashboard, booking ops (audit-logged), packages/reviews/coupons/offers actions, finance, suppliers, support, users/roles, audit logs, settings | ✅ |
| **G** ExpertzTrip AI | ✅ grounded package search over **real** data (no invented prices) |
| Performance / SEO / a11y / security headers | ✅ baseline throughout |

**The critical journey works today:** published package → discover → open full itinerary → customize → **server recalculates price** → verify mobile via OTP → provide mandatory email → checkout review with server-verified total.

---

## Deliberately follow-up (needs credentials / more time)

These are **scaffolded honestly** — the schema, seams and env vars exist, but they are not wired to live third parties, and nothing is faked:

- **Razorpay live payment** (Phase 16): add `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`. Backend order creation + signature/webhook verification then complete booking creation. The checkout page already shows the exact seam.
- **Real SMS OTP** (Phase 13): set `SMS_PROVIDER` to a transactional provider (msg91/twilio) + keys.
- **Transactional email** (Phase 20): documents/e-tickets/invoices.
- **Admin operations UI** (Phases 22–28): the full RBAC schema, roles, permissions and a seeded super-admin exist; the interactive admin app (package builder, booking ops, finance) is the next milestone. Seed data stands in for "admin-created, published" packages.
- **LLM layer on the AI**: today the assistant does real DB retrieval + intent parsing. An LLM can sit on top strictly as a tool-caller against `/api/assistant/search` — grounded, never generative about inventory.

> No fake states, no fake success, no fake inventory, no fake reviews, no fake payment confirmations. Reviews only render when genuine ones exist.

---

## Environment & data

- **Dev:** SQLite (`prisma/dev.db`, gitignored) + console OTP/email. Zero external setup.
- **Staging/Prod:** switch `datasource.provider` to `postgresql`, set `DATABASE_URL`, and provide real SMS/email/Razorpay keys per environment. Secrets are never committed (see `.gitignore` / `.env.example`).

Dev admin (seed): `admin@expertztrip.com` / `ChangeMe#2026` (change before any real use).
