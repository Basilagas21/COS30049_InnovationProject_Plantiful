-- Supabase shim for local pgTAP runs. Provides just the objects the project
-- migrations reference: auth schema with users and uid(), storage schema with
-- buckets, objects and foldername(), and the anon/authenticated/service_role
-- roles. Values for auth.uid() come from the request.jwt.claim.sub setting so
-- tests can switch identity per transaction.

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create schema if not exists storage;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text not null,
  owner uuid
);

create or replace function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
  select string_to_array(substring(name from 1 for (strpos(name, '/') - 1)::int), '/')
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$$;

grant usage on schema auth, storage to anon, authenticated, service_role;
grant all on all tables in schema auth to service_role;
grant all on all tables in schema storage to authenticated, service_role;
grant select on all tables in schema storage to anon;
grant usage, select on all sequences in schema storage to authenticated;
grant select on storage.buckets to anon, authenticated;

-- Supabase ships with RLS already active on storage.objects; the shim must
-- match that so the storage policies in apply_project.sql are exercised.
alter table storage.objects enable row level security;
alter table storage.objects force row level security;

-- Supabase grants broad table rights to the request roles; row-level
-- policies, not table rights, are what restrict access. These run from
-- run.sh after the migrations have created the public tables.
