-- 013_alert_resolution.sql — S2-09 / issue #31: officer alert acknowledgement.
--
-- Run once in Supabase Dashboard > SQL Editor, after 001_schema.sql and
-- apply_project.sql. Idempotent: safe to re-run.
--
-- Decisions (Nathan, 2 November 2026):
--   * Conservation officers and admins may mark an alert resolved.
--   * The database records who resolved it and when.
--   * Resolution is final: a resolved alert cannot be reopened from the app.
--
-- The IoT bridge/evaluator writes with the service key (no auth.uid()) and only
-- inserts unresolved alerts, so it is unaffected. RLS cannot compare old and new
-- rows, so a trigger enforces the column restriction — the same approach as
-- deny_officer_content_edit on plant_records.

-- 1. Audit columns.
alter table public.alerts add column if not exists resolved_by uuid references auth.users (id) on delete set null;
alter table public.alerts add column if not exists resolved_at timestamptz;

-- 2. Officers and admins may update an open alert (the trigger narrows what changes).
drop policy if exists alerts_officer_resolve on public.alerts;
create policy alerts_officer_resolve on public.alerts
  for update to authenticated
  using (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('conservation_officer', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('conservation_officer', 'admin')
    )
  );

-- 3. Only the resolution may change, only forwards, and the audit stamp is server-set.
create or replace function public.guard_alert_resolution()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Stamp a new resolution whoever makes it (auth.uid() is null for the service key).
  if new.resolved and not old.resolved then
    new.resolved_by := auth.uid();
    new.resolved_at := now();
  end if;

  -- Trusted contexts (service key, SQL Editor) have no auth.uid(): allow maintenance.
  if auth.uid() is null then
    return new;
  end if;

  if new.alert_id   is distinct from old.alert_id
  or new.sensor_id  is distinct from old.sensor_id
  or new.alert_type is distinct from old.alert_type
  or new.severity   is distinct from old.severity
  or new.created_at is distinct from old.created_at then
    raise exception 'Only the resolution of an alert can be changed.' using errcode = '42501';
  end if;

  if old.resolved and not new.resolved then
    raise exception 'Resolved alerts cannot be reopened.' using errcode = '42501';
  end if;

  -- Never let a client write its own audit values.
  if not (new.resolved and not old.resolved) then
    new.resolved_by := old.resolved_by;
    new.resolved_at := old.resolved_at;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_alert_resolution on public.alerts;
create trigger guard_alert_resolution
  before update on public.alerts
  for each row execute function public.guard_alert_resolution();

-- 4. Quick check — should list both columns, the policy and the trigger.
select 'column' as kind, column_name as name from information_schema.columns
  where table_schema = 'public' and table_name = 'alerts' and column_name in ('resolved_by', 'resolved_at')
union all
select 'policy', policyname from pg_policies where schemaname = 'public' and tablename = 'alerts' and policyname = 'alerts_officer_resolve'
union all
select 'trigger', tgname from pg_trigger where tgname = 'guard_alert_resolution';
