#!/usr/bin/env bash
# Run the backend pgTAP battery in a throwaway Dockerised Postgres 17.
# Usage: backend/tests/local/run.sh   (from anywhere; paths are absolute)
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/../../.." && pwd)"
container="plantiful-pgtap"

docker start "$container" >/dev/null 2>&1 || \
docker run -d --name "$container" \
  -e POSTGRES_PASSWORD=*** -e POSTGRES_DB=plantiful_test \
  postgres:17 sleep infinity >/dev/null

wait_ready() {
  for _ in $(seq 1 30); do
    if docker exec "$container" pg_isready -U postgres -d plantiful_test >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "postgres did not become ready" >&2
  return 1
}
wait_ready

if ! docker exec "$container" psql -U postgres -d plantiful_test -tAc \
    "select 1 from pg_extension where extname='pgtap'" | grep -q 1; then
  docker exec "$container" bash -c \
    "apt-get update -qq >/dev/null && apt-get install -y -qq postgresql-17-pgtap >/dev/null"
fi

psql() { docker exec -i "$container" psql -U postgres "$@"; }

# Fresh test database every run so the migrations apply from zero.
psql -q -c "drop database if exists plantiful_test" -c "create database plantiful_test"
psql -q -d plantiful_test -c "create extension if not exists pgtap"
psql -q -d plantiful_test -v ON_ERROR_STOP=1 < "$here/shim.sql"
psql -q -d plantiful_test -v ON_ERROR_STOP=1 < "$repo/backend/supabase/migrations/001_schema.sql"
psql -q -d plantiful_test -v ON_ERROR_STOP=1 < "$repo/backend/supabase/migrations/apply_project.sql"
# Table rights mirror Supabase defaults; must run after the tables exist.
psql -q -d plantiful_test -v ON_ERROR_STOP=1 <<'SQL'
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant create on schema public to service_role;
SQL
psql -X -d plantiful_test -v ON_ERROR_STOP=1 < "$here/rls_battery.sql"
