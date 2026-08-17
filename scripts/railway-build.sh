#!/bin/sh
# Railway build — bakes a fully seeded SQLite database into the image.
# The DB path is hardcoded in prisma/schema.prisma (file:./prod.db → prisma/prod.db),
# so NO environment variable is needed to build — the P1012 "DATABASE_URL"
# error cannot happen. At runtime the app uses the persistent Volume instead
# (see scripts/railway-start.sh).
set -e

# Railway installs with NODE_ENV=production (skips devDependencies). Force the
# build tools (prisma, tsx, tailwind, typescript…) to be present.
npm install --include=dev --no-audit --no-fund

rm -f prisma/prod.db
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npx next build
echo "✅ Built + seeded SQLite baked at prisma/prod.db"
