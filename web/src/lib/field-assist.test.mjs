import test from 'node:test';
import assert from 'node:assert/strict';
import { parseIdentification, identifyPlant } from './field-assist-provider.ts';
import { storagePhotoPath, photoMime, matchSpecies, fingerprint, hashBytes } from './field-assist-evidence.ts';

const plant = (name, score) => ({ score, species: { scientificNameWithoutAuthor: name, commonNames: ['Example'] }, gbif: { id: '123' } });
test('normalises, sorts and bounds provider candidates without dropping raw scores', () => {
  const value = parseIdentification('plantnet', { version: 'fixture-v1', results: [plant('A a', .1), plant('B b', .7), plant('C c', .2), plant('D d', .05)] });
  assert.equal(value.version, 'fixture-v1');
  assert.deepEqual(value.candidates.map(c => c.scientificName), ['B b', 'C c', 'A a']);
  assert.equal(value.candidates[0].score, .7);
  assert.equal(value.candidates[0].taxonId, '123');
});
test('rejects malformed response and invalid confidence rather than inventing candidates', () => {
  for (const value of [null, {}, { results: [plant('A a', NaN)] }, { results: [plant('A a', 2)] }]) {
    assert.throws(() => parseIdentification('plantnet', value), /invalid_provider_response/);
  }
});
test('Kindwise non-plant response yields no match and valid suggestions are normalised', () => {
  assert.deepEqual(parseIdentification('kindwise', { result: { is_plant: { binary: false } } }).candidates, []);
  const result = parseIdentification('kindwise', { result: { is_plant: { binary: true }, classification: { suggestions: [{ id: 's1', name: 'A a', probability: .6 }] } } });
  assert.equal(result.candidates[0].scientificName, 'A a');
  assert.equal(result.version, null);
});
test('provider transport sends binary form photos and does not send location or notes', async () => {
  const result = await identifyPlant('plantnet', 'fixture-secret', [{ bytes: new Uint8Array([255,216,255]), mime: 'image/jpeg' }], async (url, init) => {
    assert.equal(url.hostname, 'my-api.plantnet.org');
    assert.equal(url.searchParams.get('api-key'), 'fixture-secret');
    assert.deepEqual([...init.body.keys()], ['images', 'organs']);
    assert.equal(init.redirect, 'error');
    return Response.json({ results: [plant('A a', .8)] });
  });
  assert.equal(result.candidates.length, 1);
});
test('provider failures are classified and secrets never escape via error messages', async () => {
  const images = [{ bytes: new Uint8Array([255,216,255]), mime: 'image/jpeg' }];
  await assert.rejects(identifyPlant('plantnet', 'SECRET', images, async () => { throw new Error('https://provider?api-key=SECRET'); }), /^Error: provider_unavailable$/);
  await assert.rejects(identifyPlant('plantnet', 'SECRET', images, async () => new Response('', { status: 429 })), /provider_quota/);
  assert.deepEqual((await identifyPlant('plantnet', 'SECRET', images, async () => new Response('', { status: 404 }))).candidates, []);
});
test('photo source validation blocks arbitrary origins, buckets, query strings and traversal', () => {
  const origin = 'https://example.supabase.co';
  assert.deepEqual(storagePhotoPath(`${origin}/storage/v1/object/public/record-photos/u/r/p.jpg`, origin), { bucket: 'record-photos', path: 'u/r/p.jpg' });
  for (const url of ['https://attacker.test/a.jpg', `${origin}/storage/v1/object/public/private-secrets/u/r/p.jpg`, `${origin}/storage/v1/object/public/record-photos/u/r/p.jpg?token=x`, `${origin}/storage/v1/object/public/record-photos/u/%2e%2e%2fx/p.jpg`]) {
    assert.throws(() => storagePhotoPath(url, origin));
  }
});
test('image magic bytes are checked and same-path content changes alter evidence hashes', () => {
  assert.equal(photoMime(new Uint8Array([255,216,255])), 'image/jpeg');
  assert.throws(() => photoMime(new Uint8Array([1,2,3])));
  assert.notEqual(hashBytes(new Uint8Array([1])), hashBytes(new Uint8Array([2])));
  assert.notEqual(fingerprint({ version: 1 }), fingerprint({ version: 2 }));
});
test('mapping supports reviewed IDs and exact names but refuses ambiguous mappings', () => {
  const catalogue = [{ species_id: 'a', scientific_name: 'Species alpha' }, { species_id: 'b', scientific_name: 'Species beta' }];
  assert.equal(matchSpecies(' species  ALPHA ', null, 'plantnet', catalogue, []).speciesId, 'a');
  const alias = { provider: 'plantnet', provider_taxon_id: '123', scientific_name: 'Old name', species_id: 'b' };
  assert.equal(matchSpecies('Different name', '123', 'plantnet', catalogue, [alias]).speciesId, 'b');
  assert.equal(matchSpecies('Old name', '123', 'plantnet', catalogue, [alias, { ...alias, species_id: 'a' }]).speciesId, null);
  assert.equal(matchSpecies('Species gamma', null, 'plantnet', catalogue, []).speciesId, null);
});
