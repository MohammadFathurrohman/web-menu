#!/bin/sh
set -e

echo "â³ Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q; do
  sleep 1
done

echo "âœ… PostgreSQL is ready"

echo "ðŸŒ± Running seed (skipped if data already exists)..."
node scripts/seed-default.js

echo "ðŸš€ Starting server..."
exec "$@"
