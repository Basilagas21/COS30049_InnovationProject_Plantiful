-- verify_public_write_block.sql
-- R7 security verification for the Plantiful live project.
-- Paste into: Supabase Dashboard > SQL Editor > New query > Run.
--
-- Verifies, by impersonating the browser anon/authenticated sessions:
--   1. Anonymous INSERT / UPDATE / DELETE is rejected on every public-facing table.
--   2. Anonymous SELECT returns ONLY approved + submitted records and published species.
--   3. Anonymous cannot read report artifacts or photos of unpublished species.
--   4. A non-officer session cannot change approval_status or delete catalogue entries.
--   5. The publish-gate trigger (deny_unapproved_publish) blocks publishing a species
--      that has no approved, submitted record.
--   6. RLS is enabled on all public tables and storage write policies are role-gated.
--
-- All results are collected into session variables and returned at the end as a
-- single result table (copyable). No `raise notice` output is used.
--
-- Runs inside a single transaction. ROLLBACK at the end discards every side effect,
-- including any probe row that a misconfigured policy would have allowed.

begin;

-- Initialise the log and failure counter.
do $$
begin
  perform set_config('plantiful.log', '', true);
  perform set_config('plantiful.fails', '0', true);
end $$;

-- Capture probe IDs BEFORE switching roles.
do $$
begin
  perform set_config('plantiful.species_id',
    coalesce((select species_id::text from public.species where is_published = true limit 1), ''), true);
  perform set_config('plantiful.user_id',
    coalesce((select id::text from auth.users limit 1), ''), true);
  perform set_config('plantiful.record_id',
    coalesce((select record_id::text from public.plant_records
              where approval_status = 'approved' and status = 'submitted' limit 1), ''), true);
end $$;

-- ---------------------------------------------------------------------------
-- Structural audit (runs as the dashboard role)
-- ---------------------------------------------------------------------------
do $$
declare
  missing text[] := '{}';
  r record;
  anon_writes int;
  log text;
  ok boolean;
begin
  for r in
    select c.relname as t
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    if not exists (
      select 1
      from pg_class c2
      join pg_namespace n2 on n2.oid = c2.relnamespace
      where c2.relname = r.t and n2.nspname = 'public' and c2.relrowsecurity
    ) then
      missing := missing || r.t;
    end if;
  end loop;

  select count(*) into anon_writes
  from pg_policies
  where schemaname = 'public'
    and 'anon' = any (roles)
    and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL');

  if array_length(missing, 1) is not null then
    log := 'FAIL: RLS DISABLED on: ' || array_to_string(missing, ', ');
    ok := false;
  else
    log := 'PASS: RLS enabled on all public tables';
    ok := true;
  end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);
  if not ok then
    perform set_config('plantiful.fails',
      ((coalesce(nullif(current_setting('plantiful.fails', true), ''), '0'))::int + 1)::text, true);
  end if;

  if anon_writes > 0 then
    log := 'FAIL: ' || anon_writes || ' anonymous write policy/ies present';
    ok := false;
  else
    log := 'PASS: no anonymous write policy on any public table';
    ok := true;
  end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);
  if not ok then
    perform set_config('plantiful.fails',
      ((coalesce(nullif(current_setting('plantiful.fails', true), ''), '0'))::int + 1)::text, true);
  end if;

  if not exists (
    select 1 from pg_trigger t
    where t.tgname = 'trg_deny_unapproved_publish' and not t.tgisinternal
  ) then
    log := 'FAIL: publish-gate trigger (trg_deny_unapproved_publish) missing';
    ok := false;
  else
    log := 'PASS: publish-gate trigger present';
    ok := true;
  end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);
  if not ok then
    perform set_config('plantiful.fails',
      ((coalesce(nullif(current_setting('plantiful.fails', true), ''), '0'))::int + 1)::text, true);
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and 'anon' = any (roles)
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  ) then
    log := 'FAIL: anonymous write policy exists on storage.objects';
    ok := false;
  else
    log := 'PASS: no anonymous write policy on storage.objects';
    ok := true;
  end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);
  if not ok then
    perform set_config('plantiful.fails',
      ((coalesce(nullif(current_setting('plantiful.fails', true), ''), '0'))::int + 1)::text, true);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Anonymous SELECT isolation
-- ---------------------------------------------------------------------------
set local role anon;

do $$
declare
  hidden_species bigint;
  hidden_records bigint;
  report_rows bigint;
  hidden_photos bigint;
  log text;
begin
  select count(*) into hidden_species from public.species where not is_published;
  if hidden_species > 0 then log := 'FAIL: anon can read ' || hidden_species || ' unpublished species';
  else log := 'PASS: anon cannot read unpublished species'; end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);
  if hidden_species > 0 then
    perform set_config('plantiful.fails',
      ((coalesce(nullif(current_setting('plantiful.fails', true), ''), '0'))::int + 1)::text, true);
  end if;

  select count(*) into hidden_records from public.plant_records
    where not (approval_status = 'approved' and status = 'submitted');
  if hidden_records > 0 then log := 'FAIL: anon can read ' || hidden_records || ' non-approved records';
  else log := 'PASS: anon cannot read non-approved records'; end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);
  if hidden_records > 0 then
    perform set_config('plantiful.fails',
      ((coalesce(nullif(current_setting('plantiful.fails', true), ''), '0'))::int + 1)::text, true);
  end if;

  select count(*) into report_rows from public.reports;
  if report_rows > 0 then log := 'FAIL: anon can read report artifacts';
  else log := 'PASS: anon cannot read report artifacts'; end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);
  if report_rows > 0 then
    perform set_config('plantiful.fails',
      ((coalesce(nullif(current_setting('plantiful.fails', true), ''), '0'))::int + 1)::text, true);
  end if;

  select count(*) into hidden_photos
    from public.species_photos sp
    where exists (
      select 1 from public.species ss
      where ss.species_id = sp.species_id and ss.is_published = false
    );
  if hidden_photos > 0 then log := 'FAIL: anon can read photos of unpublished species';
  else log := 'PASS: anon cannot read photos of unpublished species'; end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);
  if hidden_photos > 0 then
    perform set_config('plantiful.fails',
      ((coalesce(nullif(current_setting('plantiful.fails', true), ''), '0'))::int + 1)::text, true);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Anonymous write-block (INSERT)
-- ---------------------------------------------------------------------------
do $$
declare
  s uuid;
  u uuid;
  log text;
  failed boolean := false;
begin
  s := nullif(current_setting('plantiful.species_id', true), '')::uuid;
  u := nullif(current_setting('plantiful.user_id', true), '')::uuid;

  if s is null or u is null then
    log := 'SKIP: plant_records INSERT probe needs a published species and an auth user (probe ids: species_id=' || coalesce(s::text, 'null') || ', user_id=' || coalesce(u::text, 'null') || ')';
    perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);
  else
    begin
      insert into public.plant_records (botanist_id, species_id, status, approval_status)
      values (u, s, 'submitted', 'pending');
      log := 'FAIL: anonymous INSERT into plant_records was ALLOWED';
      failed := true;
    exception when insufficient_privilege then
      log := 'PASS: anonymous INSERT into plant_records rejected (RLS)';
    when others then
      log := 'FAIL: anonymous INSERT probe raised unexpected error: ' || sqlerrm;
      failed := true;
    end;
    perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);
  end if;
  if failed then
    perform set_config('plantiful.fails',
      ((coalesce(nullif(current_setting('plantiful.fails', true), ''), '0'))::int + 1)::text, true);
  end if;

  if not exists (select 1 from public.species where is_published = true) then
    log := 'SKIP: species INSERT probe needs a published species row';
    perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);
  else
    failed := false;
    begin
      insert into public.species
        (scientific_name, common_name, conservation_status, taxonomy, description, morphology, is_published)
      select scientific_name || '-anon-probe', common_name, conservation_status,
             taxonomy, description, morphology, false
      from public.species where is_published = true limit 1;
      log := 'FAIL: anonymous INSERT into species was ALLOWED';
      failed := true;
    exception when insufficient_privilege then
      log := 'PASS: anonymous INSERT into species rejected (RLS)';
    when others then
      log := 'FAIL: anonymous species INSERT probe raised unexpected error: ' || sqlerrm;
      failed := true;
    end;
    perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);
    if failed then
      perform set_config('plantiful.fails',
        ((coalesce(nullif(current_setting('plantiful.fails', true), ''), '0'))::int + 1)::text, true);
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Anonymous write-block (UPDATE / DELETE)
-- ---------------------------------------------------------------------------
do $$
declare
  s uuid;
  rid uuid;
  c int;
  log text;
  failed boolean := false;
begin
  s := nullif(current_setting('plantiful.species_id', true), '')::uuid;

  if s is not null then
    update public.species set common_name = common_name where species_id = s;
    get diagnostics c = row_count;
    if c <> 0 then
      log := 'FAIL: anonymous UPDATE modified species rows (' || c || ')';
      failed := true;
    else
      log := 'PASS: anonymous UPDATE on species rejected (0 rows)';
    end if;
  else
    log := 'SKIP: anonymous UPDATE on species (no published species to probe)';
  end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);

  rid := nullif(current_setting('plantiful.record_id', true), '')::uuid;
  if rid is not null then
    update public.plant_records set approval_status = 'approved' where record_id = rid;
    get diagnostics c = row_count;
    if c <> 0 then
      log := 'FAIL: anonymous UPDATE changed approval_status';
      failed := true;
    else
      log := 'PASS: anonymous cannot change approval_status';
    end if;
  else
    log := 'SKIP: anonymous approval UPDATE (no approved record to probe)';
  end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);

  if s is not null then
    delete from public.species where species_id = s;
    get diagnostics c = row_count;
    if c <> 0 then
      log := 'FAIL: anonymous DELETE removed species rows (' || c || ')';
      failed := true;
    else
      log := 'PASS: anonymous DELETE on species rejected (0 rows)';
    end if;
  else
    log := 'SKIP: anonymous DELETE on species (no published species to probe)';
  end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);

  if failed then
    perform set_config('plantiful.fails',
      ((coalesce(nullif(current_setting('plantiful.fails', true), ''), '0'))::int + 1)::text, true);
  end if;
end $$;

reset role;

-- ---------------------------------------------------------------------------
-- Non-officer (authenticated, botanist-like) cannot elevate or delete
-- ---------------------------------------------------------------------------
set local role authenticated;

do $$
declare
  rid uuid;
  s uuid;
  c int;
  log text;
  failed boolean := false;
begin
  rid := nullif(current_setting('plantiful.record_id', true), '')::uuid;
  if rid is not null then
    update public.plant_records set approval_status = 'approved' where record_id = rid;
    get diagnostics c = row_count;
    if c <> 0 then
      log := 'FAIL: authenticated session changed approval_status (' || c || ')';
      failed := true;
    else
      log := 'PASS: authenticated (non-officer) session cannot approve records';
    end if;
  else
    log := 'SKIP: authenticated approval UPDATE (no approved record to probe)';
  end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);

  s := nullif(current_setting('plantiful.species_id', true), '')::uuid;
  if s is not null then
    delete from public.species where species_id = s;
    get diagnostics c = row_count;
    if c <> 0 then
      log := 'FAIL: authenticated session deleted a species (' || c || ')';
      failed := true;
    else
      log := 'PASS: authenticated (non-officer) session cannot delete species';
    end if;
  else
    log := 'SKIP: authenticated DELETE on species (no published species to probe)';
  end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);

  if failed then
    perform set_config('plantiful.fails',
      ((coalesce(nullif(current_setting('plantiful.fails', true), ''), '0'))::int + 1)::text, true);
  end if;
end $$;

reset role;

-- ---------------------------------------------------------------------------
-- Functional publish-gate test (BEFORE UPDATE trigger)
-- ---------------------------------------------------------------------------
do $$
declare
  pid uuid;
  log text;
  msg text := '';
begin
  select species_id into pid
  from public.species s
  where s.is_published = false
    and not exists (
      select 1 from public.plant_records pr
      where pr.species_id = s.species_id
        and pr.approval_status = 'approved'
        and pr.status = 'submitted'
    )
  limit 1;

  if pid is null then
    log := 'SKIP: publish-gate probe (no unpublished species lacking approved records)';
  else
    begin
      update public.species set is_published = true where species_id = pid;
      log := 'FAIL: publish gate ALLOWED publishing a species with no approved record';
      perform set_config('plantiful.fails',
        ((coalesce(nullif(current_setting('plantiful.fails', true), ''), '0'))::int + 1)::text, true);
    exception when others then
      log := 'PASS: publish gate rejected publishing unapproved species';
    end;
  end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);
end $$;

-- ---------------------------------------------------------------------------
-- Storage policy matrix
-- ---------------------------------------------------------------------------
do $$
declare
  log text;
  ok boolean := true;
begin
  if not exists (select 1 from storage.buckets where id = 'record-photos')
    or not exists (select 1 from storage.buckets where id = 'species-photos')
    or not exists (select 1 from storage.buckets where id = 'reports') then
    log := 'FAIL: one or more required storage buckets are missing';
    ok := false;
  else
    log := 'PASS: record-photos / species-photos / reports buckets exist';
  end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);

  if not exists (select 1 from pg_policies where schemaname='storage' and policyname='public_read_record_photos')
    or not exists (select 1 from pg_policies where schemaname='storage' and policyname='public_read_species_photos')
    or not exists (select 1 from pg_policies where schemaname='storage' and policyname='authenticated_insert_record_photos')
    or not exists (select 1 from pg_policies where schemaname='storage' and policyname='officer_insert_species_photos')
    or not exists (select 1 from pg_policies where schemaname='storage' and policyname='officer_delete_species_photos')
    or not exists (select 1 from pg_policies where schemaname='storage' and policyname='officer_insert_reports')
    or not exists (select 1 from pg_policies where schemaname='storage' and policyname='officer_read_reports') then
    log := 'FAIL: storage policy matrix is incomplete';
    ok := false;
  else
    log := 'PASS: storage policy matrix complete (public read / role-gated writes)';
  end if;
  perform set_config('plantiful.log', coalesce(current_setting('plantiful.log', true), '') || log || E'\n', true);

  if not ok then
    perform set_config('plantiful.fails',
      ((coalesce(nullif(current_setting('plantiful.fails', true), ''), '0'))::int + 1)::text, true);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Final verdict + single copyable result table
-- ---------------------------------------------------------------------------
do $$
declare
  fails int := coalesce(nullif(current_setting('plantiful.fails', true), ''), '0')::int;
begin
  if fails > 0 then
    perform set_config('plantiful.log',
      coalesce(current_setting('plantiful.log', true), '')
      || 'VERDICT: ' || fails || ' FAILURE(S) FOUND - see FAIL lines above. R7 NOT fully confirmed.' || E'\n', true);
  else
    perform set_config('plantiful.log',
      coalesce(current_setting('plantiful.log', true), '')
      || 'VERDICT: ALL CHECKS PASSED - R7 public write-block CONFIRMED.' || E'\n', true);
  end if;
end $$;

select line as check_result
from unnest(string_to_array(nullif(current_setting('plantiful.log', true), ''), E'\n')) as t(line)
where line <> '';

rollback;