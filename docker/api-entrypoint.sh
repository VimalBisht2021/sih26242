#!/bin/sh
set -e

# Ensure evidence storage directory exists and has appropriate permissions
mkdir -p "${EVIDENCE_STORAGE_DIR:-/app/storage/evidence}"
chown -R node:node /app/storage 2>/dev/null || true
chmod -R 775 /app/storage 2>/dev/null || true

echo "[+] Waiting for PostgreSQL to accept connections..."
until pg_isready -h "${POSTGRES_HOST:-postgres}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-sih_user}"; do
  echo "    PostgreSQL is unavailable - sleeping 1s..."
  sleep 1
done
echo "[+] PostgreSQL is ready."

echo "[+] Deploying Prisma database migrations..."
if ! su-exec node /app/packages/database/node_modules/.bin/prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma; then
  echo "[!] Existing schema detected. Baselining initial migration..."
  su-exec node /app/packages/database/node_modules/.bin/prisma migrate resolve --applied 20261004000000_init --schema=/app/packages/database/prisma/schema.prisma || true
  su-exec node /app/packages/database/node_modules/.bin/prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma || true
fi

if [ "$AUTO_SEED" = "true" ]; then
  echo "[+] AUTO_SEED=true: Seeding database..."
  su-exec node node /app/apps/api/dist/seed.js
fi

echo "[+] Starting API server as node user..."
exec su-exec node "$@"