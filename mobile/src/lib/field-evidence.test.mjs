import test from 'node:test';
import assert from 'node:assert/strict';
import { evidenceChecklist, cyclePart, partState } from './field-evidence.ts';

test('zero coordinates are valid, missing accuracy stays unknown and identification is not inferred', () => {
  const checks = evidenceChecklist({ photoCount: 1, latitude: 0, longitude: 0, identified: false, provisionalName: 'Unknown tree' });
  assert.equal(checks[1].complete, true);
  assert.match(checks[1].label, /accuracy unavailable/);
  assert.equal(checks[2].complete, false);
  assert.match(checks[2].label, /unresolved/);
});
test('invalid coordinates and nonfinite accuracy never appear complete or precise', () => {
  assert.equal(evidenceChecklist({ photoCount: 0, latitude: 91, longitude: 0, identified: false })[1].complete, false);
  assert.match(evidenceChecklist({ photoCount: 1, latitude: 1, longitude: 2, accuracyM: NaN, identified: true })[1].label, /unavailable/);
});
test('organ declarations cycle independently and preserve collector notes', () => {
  let notes = cyclePart('Plant beside stream', 'flower');
  assert.equal(partState(notes, 'flower'), 'photographed');
  notes = cyclePart(notes, 'flower');
  assert.equal(partState(notes, 'flower'), 'not available');
  notes = cyclePart(notes, 'leaf');
  assert.equal(partState(notes, 'flower'), 'not available');
  assert.equal(partState(notes, 'leaf'), 'photographed');
  assert.match(notes, /^Plant beside stream/);
  notes = cyclePart(notes, 'flower');
  assert.equal(partState(notes, 'flower'), 'not checked');
});
test('checklist declarations alone do not masquerade as descriptive field notes', () => {
  assert.equal(evidenceChecklist({ photoCount: 0, identified: false, notes: cyclePart('', 'flower') })[3].complete, false);
  assert.equal(evidenceChecklist({ photoCount: 0, identified: false, morphology: 'Opposite leaves' })[3].complete, true);
});
