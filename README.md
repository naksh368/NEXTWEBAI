# JST Andaman Travels

**Discover Andaman. Experience More.**

A complete, production-ready website and management system for an Andaman &
Nicobar Islands travel agency: a public site customers browse and enquire
through, and a secure admin panel the agency runs the business from — packages,
itineraries, photographs, enquiries and every piece of website copy, all
editable without touching code.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma ·
PostgreSQL**.

---

## What it does

### For customers
| Page | What it is |
| --- | --- |
| `/` | Hero with a working trip-enquiry panel, featured packages, islands, gallery, testimonials, FAQs |
| `/packages` | All packages, filterable by hotel category, duration, price, group size and island |
| `/packages/[slug]` | Full package: photo gallery, day-by-day itinerary, inclusions, exclusions, policies, FAQs, enquiry |
| `/packages/[slug]/itinerary` | A clean, printable itinerary document |
| `/packages/[slug]/itinerary.pdf` | **A real, downloadable PDF** — branded, illustrated, generated on the server |
| `/destinations`, `/destinations/[slug]` | Port Blair, Havelock, Neil and the sights, each with the packages that visit them |
| `/gallery` | Filterable photo gallery with a full-screen viewer |
| `/ai` | Trip planner — answers only from real published packages |
| `/about`, `/contact`, `/faq` | Company, contact details with a map, and answers |
| `/privacy-policy`, `/terms` | Policies written from how the business actually operates |

### For the agency (`/admin`)
Dashboard · Enquiries (search, filter, statuses, internal notes, CSV export) ·
Packages · Itinerary editor · Destinations · Media library · **Gallery** ·
**Testimonials** · **Website content** · Bookings · Quotes · Customers ·
Offers · Coupons · Users & roles · Audit log · Settings.

---

## Quick start

```bash
npm install
cp .env.example .env          # then fill in DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:push               # create the schema
npm run db:seed               # load the Andaman catalogue
npm run dev                   # http://localhost:3000
```

Sign in at `/sign-in` with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set.

> **There is no default admin password.** Until `ADMIN_EMAIL` and
> `ADMIN_PASSWORD` are both set (12+ characters), admin login is disabled and
> every attempt is denied. A password compiled into the source would be public
> the moment the repository is cloned.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (`prisma generate` + `next build`) |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (pricing, booking states, PDF writer, settings, filters) |
| `npm run db:push` | Apply the Prisma schema |
| `npm run db:seed` | Seed an **empty** database (no-op if packages already exist) |
| `npm run db:reset` | Wipe and re-seed — **destroys all data** |

Full deployment walkthrough → **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

---

## How it is put together

```
src/
  app/
    (public)              /, /packages, /destinations, /gallery, /about,
                          /contact, /faq, /privacy-policy, /terms, /ai
    admin/(panel)/        the management system (server-side permission checks)
    account/              customer area (OTP-gated)
    api/                  enquiry, pricing, media, auth, CSV export, cron
  components/
    ui/                   design system: button, card, badge, input, select…
    layout/               header, footer, page header, announcement, contact FAB
    enquiry/              the trip-planner enquiry panel
    package/  gallery/  admin/  ai/
  lib/
    brand.ts              compiled brand fallbacks (name, address, phone, colours)
    site-settings.ts      the DB-backed, admin-editable website content
    queries.ts            every public read query, in one place
    pdf.ts                dependency-free PDF writer (text, images, pagination)
    pdf-assets.ts         image loading for PDFs (remote, media library, /public)
    rate-limit.ts         per-address throttling for public write endpoints
    services/             pricing, bookings, email, SMS, AI, audit
prisma/
  schema.prisma           the full domain model
  seed.ts                 the Andaman catalogue
tests/                    node:test — no extra test runner
```

### Principles this codebase holds to

**Nothing is invented.** The review score, review count, traveller count and
registration number all start empty and each one stays hidden until an
administrator enters a real value. No testimonials and no customer reviews are
seeded; the homepage testimonial section hides itself entirely until the agency
publishes a genuine one.

**Prices are honest.** Every price is a *starting rate* for the stated
occupancy and group size, flagged as indicative, and confirmed in writing
before a booking. An enquiry explicitly books and holds nothing. The site never
claims live availability, because hotels and ferries are confirmed by hand.

**Inclusions are per package.** A package without air-conditioned transport
says so. Nothing is assumed to carry across between tiers, in the cards, on the
detail page, or in the PDF.

**Permissions are enforced on the server.** Every admin action re-checks the
caller's permission before writing. Hiding a button is never the only defence.
Unauthenticated requests to admin APIs get a 403 with no data.

**Content is editable, not hard-coded.** Brand name, logo, tagline, hero copy
and image, phone numbers, WhatsApp, email, address, social links, the
announcement bar, promotional dates, the price disclaimer and the SEO defaults
all live in the database and are edited at **Admin → Website content**.

---

## The PDF itinerary

`/packages/[slug]/itinerary.pdf` returns a real PDF file, generated on the
server from the same database records the web page uses — so a customer's saved
copy can never drift from what the site shows.

It is written by `src/lib/pdf.ts`, a small PDF writer with **no dependencies**:
a headless browser is not available on a serverless runtime, and a rendering
library is a lot of weight for one document. It handles text, headings,
bullets, rules, filled panels, page numbers and embedded JPEGs (the brand logo
and the package photography), and it paginates automatically.

Two consequences worth knowing:

- The standard PDF fonts have no `₹` glyph, so prices are written `INR 22,600`.
  Typographic punctuation is transliterated the same way (see `toWinAnsi`).
- Only JPEG images can be embedded. A photograph that cannot be fetched is
  simply left out and the document still renders completely.

Unpublished and unknown packages return 404 rather than leaking a draft price.

---

## The AI trip planner

Optional, and off unless `AI_API_KEY` is set. It works with any
OpenAI-compatible endpoint (OpenRouter, OpenAI, Azure, a local gateway) chosen
with `AI_BASE_URL`.

The model is given **no inventory of its own**. It can only answer from
packages returned by a `search_packages` tool that queries published rows in
this database, and it is instructed to decline anything outside the Andamans.
With no key set, `/ai` falls back to grounded keyword search over the same
data — there is no "creative" mode where prices could be invented.

The planner appears as **Asha**, an illustrated AI assistant (she says plainly
that she is an AI): a launcher at the bottom right of every public page, the
full-page `/ai`, and the place names on the homepage map, which open her with
a question about that place. She can sketch a customised day-by-day plan, but
only ever prices it via the closest real package — the team quotes the rest.
Because she searches the live database on every question, anything an admin
publishes or edits is in her answers straight away; there is nothing to
retrain. Free OpenRouter models work — see `AI_MODEL` in `.env.example`.

The floating call and WhatsApp buttons (bottom left) use the phone and
WhatsApp numbers from **Admin → Content**.

### Homepage map

The illustrated island map is generated from approximate coastline points:
edit `scripts/generate-andaman-map.py` and run
`python3 scripts/generate-andaman-map.py` to rewrite
`src/components/home/andaman-map-data.ts`. It is a picture, not a chart.

---

## Seed data and photography

`npm run db:seed` populates an **empty** database only; it skips entirely if
packages already exist, so a deploy can never wipe real enquiries. Force a full
reset with `FORCE_SEED=1`.

It creates the eight Andaman destinations, the five promotional packages with
the complete six-day itinerary, the gallery, the FAQs, roles and permissions,
and the website content defaults.

**The seeded photography is licensed stock**, chosen so that each image matches
the scene its alt text describes — it never claims to be a specific Andaman
landmark it does not show. Replace it with the agency's own photographs from
**Admin → Media Library** and **Admin → Gallery**.

---

## Testing

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

`npm test` covers the pricing engine, the booking state machine, package
availability, city search, the PDF writer (encoding, wrapping, pagination,
xref integrity) and the settings/filter logic — 62 tests, no extra runner.
