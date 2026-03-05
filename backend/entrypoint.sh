#!/bin/sh
set -e

echo "Waiting for postgres..."
until pg_isready -h postgres -U postgres -q; do
  sleep 1
done

echo "Running migrations..."
mix ecto.create 2>/dev/null || true
mix ecto.migrate

echo "Starting server..."
exec "$@"
