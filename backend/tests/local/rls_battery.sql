-- pgTAP battery for the Plantiful data layer. Run via
-- backend/tests/local/run.sh (dockerised Postgres 17 + pgTAP).
-- Identity switching mirrors Supabase: auth.uid() reads the
-- request.jwt.claim.sub setting, so each test sets its role and user id.
-- pgTAP notes: throws_ok takes (sql, errcode, exact message, description);
-- UPDATE/DELETE filtered out by an RLS USING clause affect zero rows without
-- raising, so those are asserted by row counts, while WITH CHECK violations
-- and unique conflicts raise 42501 and 23505.

begin;
select plan(34);

-- Fixtures ---------------------------------------------------------------
set local role service_role;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'bot-a.test'),
  ('22222222-2222-2222-2222-222222222222', 'bot-b.test'),
  ('33333333-3333-3333-3333-333333333333', 'officer.test'),
  ('44444444-4444-4444-4444-444444444444', 'admin.test');

update public.user_profiles set role = 'botanist' where user_id in
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
update public.user_profiles set role = 'conservation_officer' where user_id =
  '33333333-3333-3333-3333-333333333333';
update public.user_profiles set role = 'admin' where user_id =
  '44444444-4444-4444-4444-444444444444';

insert into public.species (species_id, scientific_name, is_published) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Testus publishedus', false),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Testus hiddenus', false);

insert into public.plant_records
  (record_id, species_id, botanist_id, provisional_name, status, approval_status)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'Record A1', 'submitted', 'pending'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-222222222222', 'Record B1', 'submitted', 'pending');

-- Helpers ----------------------------------------------------------------
create or replace function as_role(role_name text, sub uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', sub::text, true);
  execute format('set local role %I', role_name);
end;
$$ language plpgsql;

create or replace function as_anon() returns void as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  set local role anon;
end;
$$ language plpgsql;

-- Anon surface ------------------------------------------------------------
select as_anon();
select is_empty('select 1 from public.species', 'anon cannot read unpublished species');
select is_empty('select 1 from public.plant_records', 'anon cannot read non-approved records');
select throws_ok($$insert into public.species (scientific_name) values ('anon write')$$,
  42501, 'new row violates row-level security policy for table "species"',
  'anon cannot insert species');
select throws_ok($$insert into public.plant_records (provisional_name) values ('anon write')$$,
  42501, 'new row violates row-level security policy for table "plant_records"',
  'anon cannot insert records');
select lives_ok($$update public.species set is_published = true
  where species_id = 'aaaaaaaa-0000-0000-0000-000000000001'$$, 'anon publish attempt executes');
set local role service_role;
select is((select is_published from public.species where species_id =
  'aaaaaaaa-0000-0000-0000-000000000001'), false, 'anon cannot publish species');

-- Approved + published becomes visible -------------------------------------
select as_role('authenticated', '33333333-3333-3333-3333-333333333333');
update public.plant_records set approval_status = 'approved'
  where record_id = 'bbbbbbbb-0000-0000-0000-000000000001';
select isnt_empty('select 1 from public.plant_records', 'officer reads all records');

select as_role('authenticated', '44444444-4444-4444-4444-444444444444');
update public.species set is_published = true
  where species_id = 'aaaaaaaa-0000-0000-0000-000000000001';

select as_anon();
select isnt_empty('select 1 from public.species', 'anon reads published species');
select isnt_empty('select 1 from public.plant_records', 'anon reads approved submitted records');
with d as (
  delete from public.plant_records where record_id = 'bbbbbbbb-0000-0000-0000-000000000001'
  returning 1)
select is((select count(*)::int from d), 0, 'anon cannot delete records');

-- Botanist ownership --------------------------------------------------------
-- Record A1 is approved and record B1 belongs to botanist B. A's update
-- policies only admit their own pending rows, so both tamper attempts below
-- match zero rows; self-approval is caught by the WITH CHECK clause.
select as_role('authenticated', '11111111-1111-1111-1111-111111111111');
select is((select count(*)::int from public.plant_records), 1,
  'botanist A sees only own record');
with u as (
  update public.plant_records set notes = 'tamper'
  where record_id = 'bbbbbbbb-0000-0000-0000-000000000002' returning 1)
select is((select count(*)::int from u), 0, 'botanist cannot edit another owner record');
select throws_ok($$update public.plant_records set approval_status = 'approved'
  where record_id = 'bbbbbbbb-0000-0000-0000-000000000001'$$,
  42501, 'new row violates row-level security policy for table "plant_records"',
  'botanist cannot self-approve');
select throws_ok($$update public.plant_records set notes = 'own edit'
  where record_id = 'bbbbbbbb-0000-0000-0000-000000000001'$$,
  42501, 'new row violates row-level security policy for table "plant_records"',
  'botanist cannot edit an approved record');

-- Officer review powers ------------------------------------------------------
select as_role('authenticated', '33333333-3333-3333-3333-333333333333');
select lives_ok($$update public.plant_records set approval_status = 'rejected',
  rejection_reason = 'needs scale photo' where record_id =
  'bbbbbbbb-0000-0000-0000-000000000002'$$, 'officer rejects with reason');
with d as (
  delete from public.plant_records where record_id = 'bbbbbbbb-0000-0000-0000-000000000002'
  returning 1)
select is((select count(*)::int from d), 0, 'officer cannot delete records');
select throws_ok($$update public.plant_records set notes = 'content tamper'
  where record_id = 'bbbbbbbb-0000-0000-0000-000000000001'$$,
  'P0001', 'Officers may only change the review status of a record, not its content',
  'officer cannot edit reviewed record content');
select lives_ok($$insert into public.species (scientific_name) values ('Officer new species')$$,
  'officer inserts species');

-- Publish gate ---------------------------------------------------------------
select throws_ok($$update public.species set is_published = true where species_id =
  'aaaaaaaa-0000-0000-0000-000000000002'$$,
  'P0001', 'Species cannot be published until at least one record is approved',
  'publish gate blocks species without an approved record');

-- Conflict reports ------------------------------------------------------------
select as_role('authenticated', '11111111-1111-1111-1111-111111111111');
select lives_ok($$insert into public.sync_conflicts (record_id, botanist_id, device_id, message)
  values ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
          'dev-1', 'own filing')$$, 'botanist files own conflict report');
select throws_ok($$insert into public.sync_conflicts (record_id, botanist_id, device_id)
  values ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
          'dev-1')$$,
  '23505', 'duplicate key value violates unique constraint "sync_conflicts_record_device_key"',
  'duplicate report on same record and device rejected');
select throws_ok($$insert into public.sync_conflicts (record_id, botanist_id, device_id)
  values ('bbbbbbbb-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
          'dev-1')$$,
  42501, 'new row violates row-level security policy for table "sync_conflicts"',
  'cross-owner filing rejected');

select as_role('authenticated', '33333333-3333-3333-3333-333333333333');
select isnt_empty('select 1 from public.sync_conflicts', 'officer reads conflict reports');

select as_anon();
select is_empty('select 1 from public.sync_conflicts', 'anon cannot read conflict reports');

-- Storage ----------------------------------------------------------------------
select as_role('authenticated', '11111111-1111-1111-1111-111111111111');
select lives_ok($$insert into storage.objects (bucket_id, name, owner)
  values ('record-photos', '11111111-1111-1111-1111-111111111111/rec1/photo.jpg',
          '11111111-1111-1111-1111-111111111111')$$, 'owner uploads own photo');
select throws_ok($$insert into storage.objects (bucket_id, name, owner)
  values ('record-photos', '22222222-2222-2222-2222-222222222222/rec2/photo.jpg',
          '22222222-2222-2222-2222-222222222222')$$,
  42501, 'new row violates row-level security policy for table "objects"',
  'cannot upload into another folder');
select throws_ok($$insert into storage.objects (bucket_id, name)
  values ('reports', 'officer/report.csv')$$,
  42501, 'new row violates row-level security policy for table "objects"',
  'botanist cannot upload reports');

select as_anon();
select isnt_empty('select 1 from storage.objects where bucket_id = ''record-photos''',
  'anon reads public record photos');
select is_empty('select 1 from storage.objects where bucket_id = ''reports''',
  'anon cannot read report objects');

-- Bulk publish attempts ------------------------------------------------------
-- A single statement touching many species must still be gated row by row:
-- species with an approved record pass, the rest all fail the same gate.
select as_role('authenticated', '44444444-4444-4444-4444-444444444444');
insert into public.species (species_id, scientific_name, is_published) values
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Testus bulkus one', false),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'Testus bulkus two', false);
select throws_ok($$update public.species set is_published = true
  where species_id in ('aaaaaaaa-0000-0000-0000-000000000003',
                       'aaaaaaaa-0000-0000-0000-000000000004',
                       'aaaaaaaa-0000-0000-0000-000000000002')$$,
  'P0001', 'Species cannot be published until at least one record is approved',
  'bulk publish of unapproved species is rejected row by row');
set local role service_role;
select is((select count(*)::int from public.species where is_published), 1,
  'bulk publish left no species newly published');

-- Republish after rejection: approval withdrawn, gate must re-engage.
select as_role('authenticated', '33333333-3333-3333-3333-333333333333');
select lives_ok($$update public.plant_records set approval_status = 'rejected'
  where record_id = 'bbbbbbbb-0000-0000-0000-000000000001'$$,
  'officer withdraws approval to rejected');
select as_role('authenticated', '44444444-4444-4444-4444-444444444444');
select lives_ok($$update public.species set is_published = false
  where species_id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  'unpublishing is always allowed');
select throws_ok($$update public.species set is_published = true where species_id =
  'aaaaaaaa-0000-0000-0000-000000000001'$$,
  'P0001', 'Species cannot be published until at least one record is approved',
  'republish blocked after the approving record was rejected');

select * from finish();
rollback;
