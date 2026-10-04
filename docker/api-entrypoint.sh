#!/bin/sh
set -e

echo "[+] Waiting for PostgreSQL to accept connections..."
until pg_isready -h "${POSTGRES_HOST:-postgres}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-sih_user}"; do
  echo "    PostgreSQL is unavailable - sleeping 1s..."
  sleep 1
done
echo "[+] PostgreSQL is ready."

echo "[+] Deploying Prisma database migrations..."
if ! /app/packages/database/node_modules/.bin/prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma; then
  echo "[!] Existing schema detected. Baselining initial migration..."
  /app/packages/database/node_modules/.bin/prisma migrate resolve --applied 20261004000000_init --schema=/app/packages/database/prisma/schema.prisma || true
  /app/packages/database/node_modules/.bin/prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma || true
fi

if [ "$AUTO_SEED" = "true" ]; then
  echo "[+] AUTO_SEED=true: Seeding database..."
  node /app/apps/api/dist/seed.js
fi

echo "[+] Starting API server..."
exec "$@"