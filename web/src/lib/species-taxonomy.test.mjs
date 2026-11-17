import assert from 'node:assert/strict';
import test from 'node:test';

const { familyFromTaxonomy, isThreatenedStatus } = await import('@/lib/species-taxonomy');

test('familyFromTaxonomy returns the family segment', () => {
  assert.equal(familyFromTaxonomy('Malpighiales · Rafflesiaceae'), 'Rafflesiaceae');
  assert.equal(familyFromTaxonomy('Orchidaceae'), 'Orchidaceae');
  assert.equal(familyFromTaxonomy(null), null);
});

test('isThreatenedStatus handles case and whitespace', () => {
  assert.equal(isThreatenedStatus('Endangered'), true);
  assert.equal(isThreatenedStatus(' vulnerable '), true);
  assert.equal(isThreatenedStatus('Least concern'), false);
  assert.equal(isThreatenedStatus(null), false);
});
