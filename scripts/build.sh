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
DATABASE_URL="${POSTGRES_URL_NON_POOLING:-${DATABASE_URL_UNPOOLED:-${DATABASE_URL:-${POSTGRES_URL:-$POSTGRES_PRISMA_URL}}}}"
export DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
  echo "✖ No database found. Attach a Postgres database (Railway PostgreSQL plugin,"
  echo "  or Vercel Storage), or set DATABASE_URL, then redeploy."
  exit 1
fi

npx prisma generate
npx prisma db push --accept-data-loss
npx tsx prisma/seed.ts
npx next build
