#!/bin/sh
# Universal production build (Vercel / Railway / Render).
# Installs build tools, resolves the database URL from whatever the host
# provides, then generates the client, syncs the schema, seeds an empty DB and
# builds. No SQLite, no persistent disk — plain PostgreSQL, works anywhere.
set -e

# Railway installs with NODE_ENV=production (skips devDependencies).
npm install --include=dev --no-audit --no-fund --legacy-peer-deps

# Accept the DB connection under any host's variable name. Prefer a DIRECT
# (non-pooled) connection first, because `prisma db push` fails over a pooler.
# (Vercel Storage provides both; Railway/Neon usually just DATABASE_URL.)
# Netlify DB (Neon) provides NETLIFY_DATABASE_URL / NETLIFY_DATABASE_URL_UNPOOLED.
DATABASE_URL="${POSTGRES_URL_NON_POOLING:-${DATABASE_URL_UNPOOLED:-${NETLIFY_DATABASE_URL_UNPOOLED:-${DATABASE_URL:-${NETLIFY_DATABASE_URL:-${POSTGRES_URL:-$POSTGRES_PRISMA_URL}}}}}}"
export DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
  echo "✖ No database found — the build needs a PostgreSQL database."
  echo "  Netlify: Site configuration → Environment variables → add DATABASE_URL"
  echo "           (your Neon or Supabase connection string), or add Netlify DB."
  echo "  Vercel:  Storage → Create Database → Neon → Connect."
  echo "  Railway: add a PostgreSQL service and set DATABASE_URL=\${{Postgres.DATABASE_URL}}."
  echo "  Then redeploy."
  exit 1
fi

npx prisma generate

# Bring the database in line with the schema. --accept-data-loss is required
# for a non-interactive build; it only matters when a schema change removes a
# column, so review schema.prisma before deploying a destructive change.
npx prisma db push --accept-data-loss

# Seeds an EMPTY database only. If packages already exist the seed exits
# without touching anything, so a redeploy can never wipe real enquiries,
# edited packages or uploaded photographs.
npx tsx prisma/seed.ts

npx next build
