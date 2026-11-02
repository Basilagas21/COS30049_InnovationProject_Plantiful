import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Page-level markup tests: officer-gated components render through
// react-dom/server with stubbed next imports, proving the components build
// valid markup and the role gate hides review actions from non-officers.
// No Supabase session is simulated; rendering never reaches the client.

const { RecordsBrowser } = await import('@/components/records-browser');
const { ApproveRejectButtons } = await import('@/components/approve-reject');

const record = {
  id: 'bbbbbbbb-0000-0000-0000-000000000001',
  qrCode: 'PLT-TEST01',
  scientificName: 'Testus renderus',
  commonName: 'Render test',
  provisionalName: null,
  conservationStatus: 'endangered',
  gpsLat: null,
  gpsLng: null,
  gpsAccuracyM: null,
  heightCm: 100,
  morphology: null,
  notes: null,
  photoUrl: null,
  approvalStatus: 'pending',
  status: 'submitted',
  isPublished: false,
  createdAt: '2026-11-01T00:00:00Z',
  reviewedAt: null,
};

test('records browser renders rows for non-officers without review actions', () => {
  const html = renderToStaticMarkup(h(RecordsBrowser, { records: [record], officer: false }));
  assert.match(html, /Testus renderus/, 'scientific name is shown');
  assert.match(html, /href="\/records\/bbbbbbbb-0000-0000-0000-000000000001"/, 'card links to the record');
  assert.doesNotMatch(html, /Approve</, 'no approve affordance for non-officers');
});

test('records browser shows review affordances for officers', () => {
  const html = renderToStaticMarkup(h(RecordsBrowser, { records: [record], officer: true }));
  assert.match(html, /Approve</, 'approve affordance present for officers');
});

test('approve reject buttons render both decisions', () => {
  const html = renderToStaticMarkup(h(ApproveRejectButtons, { recordId: record.id }));
  assert.match(html, /Approve/);
  assert.match(html, /Reject/);
});
