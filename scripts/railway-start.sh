#!/bin/sh
# Railway start — put the SQLite DB on the persistent Volume, then run the app.
# The Volume is mounted at /data (configure it in Railway → service → Volumes).
# First boot: copy the baked, seeded DB onto the Volume. Later boots reuse it,
# so bookings/customers/admin edits persist across deploys.
set -e

DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR"

if [ ! -f "$DATA_DIR/prod.db" ]; then
  echo "First boot — seeding the Volume from the baked catalogue…"
  cp "$(pwd)/prisma/prod.db" "$DATA_DIR/prod.db"
fi

export DATABASE_URL="file:$DATA_DIR/prod.db"
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
