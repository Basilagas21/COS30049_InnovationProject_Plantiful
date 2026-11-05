import test from 'node:test';
import assert from 'node:assert/strict';
import { summariseEvaluation } from './field-assist-evaluation.ts';
test('evaluation includes failures in denominators and never invents cost or empty-set accuracy', () => {
  const base = { observationId: 'a', species: 'A a', supported: true, acceptableNames: ['A a'], durationMs: 10, cost: null };
  const result = summariseEvaluation([
    { ...base, status: 'success', candidates: ['B b','A a'] },
    { ...base, observationId: 'b', status: 'failed', candidates: [], durationMs: 30 },
  ]);
  assert.equal(result.top1Accuracy, 0);
  assert.equal(result.top3Accuracy, .5);
  assert.equal(result.failed, 1);
  assert.equal(result.medianDurationMs, 20);
  assert.equal(result.measuredCost, null);
  assert.equal(summariseEvaluation([]).top1Accuracy, null);
});
