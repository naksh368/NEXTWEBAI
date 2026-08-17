#!/bin/sh
# Railway build — bakes a fully seeded SQLite database into the image.
# At runtime (railway-start.sh) this baked DB is copied onto the persistent
# Volume on first boot, so there is NO external database to configure.
set -e

# Build-time DB file (absolute path so it's found regardless of build dir).
BUILD_DB="$(pwd)/prisma/prod.db"
export DATABASE_URL="file:$BUILD_DB"

rm -f "$BUILD_DB"
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npx next build
echo "✅ Built + seeded SQLite baked at $BUILD_DB"
