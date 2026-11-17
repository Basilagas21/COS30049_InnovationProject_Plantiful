// Isolated PostgreSQL-compatible test. No connection to the deployed Supabase database.
// Install @electric-sql/pglite in a temporary folder and set PGLITE_MODULE to its dist/index.js.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const { PGlite } = await import(process.env.PGLITE_MODULE ? pathToFileURL(process.env.PGLITE_MODULE).href : '@electric-sql/pglite');
const db = new PGlite();
const owner = '10000000-0000-0000-0000-000000000001';
const other = '10000000-0000-0000-0000-000000000002';
const officer = '10000000-0000-0000-0000-000000000003';
const record = '20000000-0000-0000-0000-000000000001';
const species = '30000000-0000-0000-0000-000000000001';
let checks = 0;
async function check(name, fn) { await fn(); checks++; console.log(`PASS ${name}`); }
async function asUser(id, sql) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${id}', false);`);
  try { return await db.query(sql); } finally { await db.exec('reset role;'); }
}
try {
  await db.exec(await readFile(new URL('./shim.sql', import.meta.url), 'utf8'));
  // pgcrypto extension is unnecessary for core gen_random_uuid() on modern PostgreSQL.
  await db.exec((await readFile(new URL('../../supabase/migrations/001_schema.sql', import.meta.url), 'utf8')).replace('create extension if not exists "pgcrypto";', ''));
  await db.exec(await readFile(new URL('../../supabase/migrations/013_field_assist.sql', import.meta.url), 'utf8'));
  await db.exec(`insert into auth.users(id,email) values ('${owner}','owner@test.invalid'),('${other}','other@test.invalid'),('${officer}','officer@test.invalid');
    insert into public.user_profiles(user_id,name,email,role) values
    ('${owner}','Owner','owner@test.invalid','botanist'),('${other}','Other','other@test.invalid','botanist'),('${officer}','Officer','officer@test.invalid','conservation_officer');
    insert into public.species(species_id,scientific_name) values ('${species}','Test species');
    insert into public.plant_records(record_id,botanist_id,version) values ('${record}','${owner}',1);`);
  async function reserve(hash = 'hash-1', user = owner, version = 1) {
    return (await db.query('select public.ai_reserve_attempt($1,$2,$3,$4,$5,$6,$7) as result', [record,user,'plantnet',hash,version,JSON.stringify([]),JSON.stringify({})])).rows[0].result;
  }
  let attempt;
  await check('reservation creates exactly one processing attempt', async () => {
    const first = await reserve(); attempt = first.attempt.attempt_id;
    assert.equal(first.created, true);
    const second = await reserve(); assert.equal(second.created, false); assert.equal(second.attempt.attempt_id, attempt);
  });
  await check('reservation rejects other owners and stale record revisions', async () => {
    await assert.rejects(reserve('hash-other', other), /not owned/);
    await assert.rejects(reserve('hash-old', owner, 0), /Record changed/);
  });
  await check('another active provider request is rate limited', async () => {
    await assert.rejects(reserve('hash-new'), /limit reached/);
  });
  await check('owner and officer can read history, unrelated users cannot', async () => {
    assert.equal((await asUser(owner, 'select * from public.ai_identification_attempts')).rows.length, 1);
    assert.equal((await asUser(officer, 'select * from public.ai_identification_attempts')).rows.length, 1);
    assert.equal((await asUser(other, 'select * from public.ai_identification_attempts')).rows.length, 0);
  });
  await check('direct mutations and privileged reservation calls are denied to authenticated clients', async () => {
    await assert.rejects(asUser(owner, "update public.ai_identification_attempts set status='succeeded'"), /permission denied/);
    await assert.rejects(asUser(owner, `select public.ai_reserve_attempt('${record}','${owner}','plantnet','x',1,'[]','{}')`), /permission denied/);
    await assert.rejects(asUser(officer, `insert into public.ai_species_guidance(species_id,revision,prompts,source,reviewed_by) values('${species}',1,'[]','source','${officer}')`), /permission denied/);
  });
  await db.query("update public.ai_identification_attempts set status='succeeded', candidates=$1 where attempt_id=$2", [JSON.stringify([{ scientificName: 'Test species', score: .5 }]), attempt]);
  async function decision(actor, role, hash = 'hash-1') {
    return db.query('select public.ai_record_decision($1,$2,$3,$4,$5,$6,$7,$8) as id', [attempt,actor,role,species,'Test species','selected','Fixture decision',hash]);
  }
  await check('collector and officer decisions append separately and leave observation assignment unchanged', async () => {
    await decision(owner, 'collector'); await decision(officer, 'officer');
    assert.equal((await asUser(owner, 'select * from public.ai_identification_decisions')).rows.length, 2);
    assert.equal((await asUser(other, 'select * from public.ai_identification_decisions')).rows.length, 0);
    assert.equal((await db.query('select species_id from public.plant_records')).rows[0].species_id, null);
  });
  await check('role spoofing, unrelated collectors and evidence mismatch cannot add decisions', async () => {
    await assert.rejects(decision(owner, 'officer'), /Not reviewer/);
    await assert.rejects(decision(other, 'collector'), /Not owner/);
    await assert.rejects(decision(officer, 'officer', 'changed-image'), /Evidence changed/);
  });
  await check('changed record revision invalidates decisions but preserves history', async () => {
    await db.exec(`update public.plant_records set version=2 where record_id='${record}'`);
    await assert.rejects(decision(officer, 'officer'), /Evidence changed/);
    assert.equal((await db.query('select * from public.ai_identification_decisions')).rows.length, 2);
  });
  await check('interrupted processing can be retried with the earlier failed attempt retained', async () => {
    const old = await reserve('hash-2', owner, 2);
    await db.query("update public.ai_identification_attempts set created_at=now()-interval '4 minutes' where attempt_id=$1", [old.attempt.attempt_id]);
    const retried = await reserve('hash-2', owner, 2);
    assert.equal(retried.created, true);
    assert.notEqual(retried.attempt.attempt_id, old.attempt.attempt_id);
    assert.equal((await db.query('select status from public.ai_identification_attempts where attempt_id=$1', [old.attempt.attempt_id])).rows[0].status, 'failed');
  });
  await check('completed identical evidence is reused', async () => {
    await db.exec("update public.ai_identification_attempts set status='no_match' where status='processing'");
    assert.equal((await reserve('hash-2', owner, 2)).created, false);
  });
  console.log(`${checks} database checks passed. Isolated PGlite fixture, not a deployed Supabase result.`);
} finally { await db.close(); }
