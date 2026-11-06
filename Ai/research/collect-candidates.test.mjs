import test from 'node:test';
import assert from 'node:assert/strict';
import { candidatePhoto } from './collect-candidates.mjs';

const photo = { id: 12, license_code: 'cc-by', attribution: 'Photo author, CC BY', url: 'https://static.inaturalist.org/photos/12/square.jpg' };
const observation = { quality_grade: 'research', taxon: { id: 42 }, captive: false, photos: [photo] };

test('requires exact observation taxon and research-grade identification', () => {
  assert.equal(candidatePhoto(observation, 42), photo);
  assert.equal(candidatePhoto(observation, 43), null);
  assert.equal(candidatePhoto({ ...observation, quality_grade: 'needs_id' }, 42), null);
  assert.equal(candidatePhoto({ ...observation, captive: true }, 42), null);
});

test('checks each photo licence instead of trusting the observation filter', () => {
  assert.equal(candidatePhoto({ ...observation, photos: [{ ...photo, license_code: null }] }, 42), null);
  assert.equal(candidatePhoto({ ...observation, photos: [{ ...photo, license_code: 'cc-by-nc' }, photo] }, 42), photo);
  assert.equal(candidatePhoto({ ...observation, photos: [{ ...photo, attribution: null }] }, 42), null);
});

test('rejects unexpected image hosts, protocols and paths', () => {
  for (const url of ['http://static.inaturalist.org/photos/12/square.jpg', 'https://example.com/photos/12/square.jpg', 'https://static.inaturalist.org/private.jpg', 'invalid']) {
    assert.equal(candidatePhoto({ ...observation, photos: [{ ...photo, url }] }, 42), null);
  }
});
