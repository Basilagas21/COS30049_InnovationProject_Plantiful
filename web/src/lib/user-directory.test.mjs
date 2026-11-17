import assert from 'node:assert/strict';
import test from 'node:test';

const { normalizeUsersPageSize, sanitizeUserSearch } = await import('@/lib/user-directory');

test('normalizeUsersPageSize accepts supported page sizes', () => {
  assert.equal(normalizeUsersPageSize('10'), 10);
  assert.equal(normalizeUsersPageSize(25), 25);
  assert.equal(normalizeUsersPageSize('100'), 100);
});

test('normalizeUsersPageSize falls back to 25 for invalid values', () => {
  assert.equal(normalizeUsersPageSize('7'), 25);
  assert.equal(normalizeUsersPageSize('nope'), 25);
  assert.equal(normalizeUsersPageSize(null), 25);
});

test('sanitizeUserSearch removes PostgREST filter characters', () => {
  assert.equal(sanitizeUserSearch('  alice@example.com  '), 'alice@example.com');
  assert.equal(sanitizeUserSearch('foo,bar(baz)%'), 'foo bar baz');
});

test('sanitizeUserSearch caps long queries', () => {
  assert.equal(sanitizeUserSearch('a'.repeat(120)).length, 80);
});
