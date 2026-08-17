#!/bin/sh
# Production build for Vercel/Railway.
# Resolves the database URL from whatever the host provides, so you don't have
# to set DATABASE_URL by hand:
#   - DATABASE_URL            (manual, or Railway/Neon integration)
#   - POSTGRES_URL_NON_POOLING / DATABASE_URL_UNPOOLED  (Vercel Postgres — direct)
#   - POSTGRES_URL / POSTGRES_PRISMA_URL                (Vercel Postgres — pooled)
# Prefers a DIRECT (non-pooled) connection first, because `prisma db push` needs it.
set -e

: "${DATABASE_URL:=${POSTGRES_URL_NON_POOLING:-${DATABASE_URL_UNPOOLED:-${POSTGRES_URL:-$POSTGRES_PRISMA_URL}}}}"
export DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
  echo "✖ No database connection found. Add a Postgres database (Vercel Storage or Railway),"
  echo "  or set DATABASE_URL in your project's Environment Variables, then redeploy."
  exit 1
fi

npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npx next build
