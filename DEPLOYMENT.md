# Deploying JST Andaman Travels

Everything you need to take this from a clone to a live site, plus how to run
it day to day once it is up.

---

## 1. What you need

| Thing | Why | Cost |
| --- | --- | --- |
| **Node.js 20+** and npm | To build and run | free |
| **A PostgreSQL database** | Packages, enquiries, gallery, settings | free tier available |
| **A hosting account** (Vercel, Netlify, Railway, Render, or your own server) | To serve the site | free tier available |
| **A transactional email provider** | So customers get their enquiry confirmation and you get the alert | free tier available |
| **A domain name** | Your address | ~₹800/year |
| An AI key (optional) | The trip planner | pay per use |
| Razorpay keys (optional) | Only if you want online payment | per transaction |

> The site runs **fully without** the optional items. Enquiries, packages, the
> gallery, the admin panel and the PDF itinerary all work with nothing but a
> database.

---

## 2. Local development

```bash
git clone <your-repo-url>
cd NEXTWEBAI
npm install
cp .env.example .env
```

Open `.env` and set, at minimum:

```ini
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/dbname?schema=public"
AUTH_SECRET="<run: openssl rand -base64 32>"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAIL=you@yourdomain.com
ADMIN_PASSWORD="a-long-passphrase-you-choose"
```

> **Quoting matters.** If a value contains `#`, wrap it in double quotes or the
> parser treats the rest of the line as a comment:
> `ADMIN_PASSWORD="My#Pass#2026"` ✅ `ADMIN_PASSWORD=My#Pass#2026` ❌

Then:

```bash
npm run db:push     # create the tables
npm run db:seed     # load the Andaman catalogue
npm run dev         # http://localhost:3000
```

---

## 3. The database

Any PostgreSQL works. Two notes that catch people out:

**Supabase / Neon — use the direct connection string for migrations.** The
pooled string (it has `-pooler` in the host, or port 6543) cannot run schema
changes. Put the direct one in `DIRECT_URL`; `DATABASE_URL` may be either.

- Supabase: *Project Settings → Database → Connection string → URI*. Use
  **Session mode / direct** for `DIRECT_URL`.
- Neon: copy the string **without** `-pooler` for `DIRECT_URL`.
- Railway: add a PostgreSQL service, then set
  `DATABASE_URL=${{Postgres.DATABASE_URL}}` — nothing else to configure.

Apply the schema:

```bash
npm run db:push
```

`db:push` is right for this project: the schema is the source of truth and
there is no migration history to preserve. If you prefer versioned migrations,
`npx prisma migrate dev --name init` works too.

### Seeding

```bash
npm run db:seed
```

The seed **only populates an empty database** — if packages already exist it
exits without touching anything, so a deploy can never wipe real enquiries.
To deliberately wipe and reload: `FORCE_SEED=1 npx prisma db seed`.

---

## 4. Create the first administrator

There is **no default password** and no public admin sign-up.

1. Set `ADMIN_EMAIL` to an inbox you control.
2. Set `ADMIN_PASSWORD` to a passphrase of **12 characters or more**.
3. Deploy / restart.
4. Go to `/sign-in` and sign in with those two values. The administrator row is
   created on that first successful sign-in, with the password stored as a
   scrypt hash.

If an email provider is configured, a one-time code is sent to `ADMIN_EMAIL` to
finish signing in. If email is not configured, you are signed in directly — so
configure email before going live.

Add colleagues afterwards at **Admin → Users**, giving each the narrowest role
that lets them do their job (Admin → Roles lists what each one can do).

**Rotating the password:** change `ADMIN_PASSWORD` and redeploy. The previously
stored hash keeps working too, so you are never locked out mid-change.

---

## 5. Storage for images

Uploaded images are stored **in the database** and served through
`/api/media/[id]`. That means no S3 bucket, no credentials and no CORS to
configure, and it works identically on every host.

Limits: 6 MB per image; JPEG, PNG, WebP, GIF and AVIF accepted. Uploading
requires an authenticated administrator — the endpoint returns 403 otherwise.

> One caveat worth knowing: the PDF itinerary can only embed **JPEG** images.
> A PNG or WebP cover still works everywhere on the website; it is simply left
> out of the PDF. Upload covers as JPEG if you want them in the document.

---

## 6. Deploy

### Vercel

1. **vercel.com → Add New → Project →** import the repository.
2. Add the environment variables from §2 under *Settings → Environment
   Variables*, plus `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`.
3. **Deploy.** The build runs `prisma generate`, builds, and seeds an empty
   database automatically.
4. *Settings → Domains* → add your domain and follow the DNS instructions.

### Railway (database included)

1. **New Project → Deploy from GitHub repo.**
2. **+ New → Database → PostgreSQL.**
3. On the app service → *Variables*: `DATABASE_URL=${{Postgres.DATABASE_URL}}`
   plus the rest from §2.
4. *Settings → Networking → Custom Domain* → add your domain; HTTPS is
   automatic.

### Netlify / Render / your own server

`netlify.toml` and `render.yaml` are included. On your own server:

```bash
npm ci && npm run build && npm run start   # listens on $PORT, default 3000
```
Put nginx or Caddy in front for TLS.

---

## 7. Production environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `DIRECT_URL` | ✅ | Non-pooled string, for schema changes |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `https://yourdomain.com` — canonical URLs, sitemap, email links |
| `ADMIN_EMAIL` | ✅ | The first administrator's inbox |
| `ADMIN_PASSWORD` | ✅ | 12+ characters; quote it if it contains `#` |
| `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM` | strongly recommended | Without these, nobody receives enquiry confirmations or login codes |
| `BUSINESS_EMAIL` | optional | Where new-enquiry alerts go (defaults to `ADMIN_EMAIL`) |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | optional | Turns on the trip planner |
| `SMS_PROVIDER`, `MSG91_*` | optional | SMS OTP for customer login |
| `RAZORPAY_*` | optional | Only for online payment |
| `CRON_SECRET` | recommended | Protects the scheduled-job endpoints |

**Never** commit real values. `.env` is gitignored; `.env.example` is the
template and must stay free of secrets.

---

## 8. Custom domain

1. Add the domain in your host's dashboard.
2. At your registrar, add the records it shows you — usually an `A` record for
   the apex and a `CNAME` for `www`.
3. Wait for DNS (minutes to a few hours). HTTPS is issued automatically.
4. **Set `NEXT_PUBLIC_SITE_URL` to the final `https://` address and redeploy.**
   Canonical tags, the sitemap and every link in an outgoing email come from
   this value; if it is wrong, those all point at the wrong place.

---

## 9. Running the site day to day

Everything below is done in the admin panel. None of it needs a developer.

### Changing prices or packages
**Admin → Packages →** pick a package → edit the price, duration, hotel
category, minimum group size, inclusions, exclusions or itinerary → save.
Changes appear on the public site immediately.

### Editing the itinerary
**Admin → Packages → [package] → Itinerary.** Add days, remove days, reorder
them, edit the text, attach photographs. The public page and the downloadable
PDF both update.

### Handling enquiries
**Admin → Enquiries.** Search by name, phone, email, reference or package;
filter by status; call or WhatsApp in one click; set the status (New,
Contacted, Follow-up required, Quoted, Confirmed, Closed), assign an owner, set
a follow-up date and keep internal notes.

*Internal notes are staff-only.* They never appear on the website and are never
included in anything sent to the customer.

**Export:** the *Export CSV* button downloads exactly the rows your current
filter shows, internal notes included — it is your record, behind the same
permission as the list.

### Photographs
**Admin → Media Library** to upload. **Admin → Gallery** to choose which appear
publicly, set alt text and captions, group them by category and order them.
Hiding a photo takes it off the site instantly without deleting it.

### Testimonials
**Admin → Testimonials.** Enter a testimonial from a message you actually
received, then publish it. The homepage section stays hidden until at least one
is published. Nothing here is generated.

### Website copy, contact details and SEO
**Admin → Website content.** Brand name, logo, tagline, hero heading, hero
photograph, button labels, announcement bar, phone numbers, WhatsApp, email,
address, office hours, social links, promotional dates, the price disclaimer
and the SEO defaults.

> The review score, review count, traveller count and registration number start
> **empty on purpose**, and each one stays hidden on the site until you enter a
> real value. Please only enter figures you can evidence.

### When the promotional window ends
The banner changes by itself to "ask us for current rates" the day after
`promoValidTo`. To run a new promotion, set new dates in **Admin → Website
content → Pricing & trust**. Packages and enquiries are untouched.

---

## 10. Troubleshooting

**Build fails: `Environment variable not found: DATABASE_URL`**
It is not set for the build environment. On Vercel, make sure the variable is
ticked for *Production* as well as *Preview*.

**Build fails on a schema step with a pooled connection**
Set `DIRECT_URL` to the non-pooled string (no `-pooler`, port 5432).

**I cannot sign in to /admin**
`ADMIN_EMAIL` and `ADMIN_PASSWORD` must both be set, and the password must be
at least 12 characters, or the bootstrap login is disabled by design. The
server log says so explicitly at startup. Also check the quoting rule in §2 if
your password contains `#`.

**No emails arrive**
With `EMAIL_PROVIDER=console` the message is printed to the server log instead
of being sent — that is the development default. Set a real provider and key.

**Images do not load**
Remote images need their host allowed in `next.config.mjs` under
`images.remotePatterns`. Images you upload yourself are served from your own
domain and always work.

**A package shows the wrong price after an edit**
Pages are cached for a few minutes. Saving through the admin panel clears the
cache for that page automatically; if you changed the database directly, wait
for the cache window or redeploy.

**The site says "No packages published yet"**
Either the database was never seeded (`npm run db:seed`) or every package is in
draft. Check **Admin → Packages** and publish one.

---

## 11. Before you go live — checklist

- [ ] `NEXT_PUBLIC_SITE_URL` is the real `https://` domain
- [ ] `ADMIN_PASSWORD` is long and unique, and `AUTH_SECRET` is freshly generated
- [ ] A real email provider is configured and a test enquiry arrived in your inbox
- [ ] Phone, WhatsApp, email and address are correct in **Admin → Website content**
- [ ] The seeded stock photography is replaced with your own
- [ ] Prices, inclusions and the promotional dates are confirmed as correct
- [ ] **The privacy policy and booking terms have been reviewed by a lawyer.**
      The supplied text describes how the business works and is a sound
      starting point, but it has not been legally reviewed — the banner on
      those pages says so until you replace the text.
- [ ] Any review score or traveller count you entered is a real, evidenced figure
