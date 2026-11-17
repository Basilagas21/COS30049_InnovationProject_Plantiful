import assert from 'node:assert/strict';
import test from 'node:test';

const {
  conservationStatusGuide,
  plantQuestionsForSpecies,
  visitorPlantQuestions,
} = await import('@/lib/plant-learning');

test('visitorPlantQuestions contains complete question and answer pairs', () => {
  assert.ok(visitorPlantQuestions.length >= 8);
  for (const entry of visitorPlantQuestions) {
    assert.ok(entry.question.trim().length > 0);
    assert.ok(entry.answer.trim().length > 0);
  }
});

test('conservationStatusGuide covers the main threat categories', () => {
  const statuses = conservationStatusGuide.map((entry) => entry.status);
  assert.deepEqual(statuses, [
    'Least Concern',
    'Near Threatened',
    'Vulnerable',
    'Endangered',
    'Critically Endangered',
    'Data Deficient',
  ]);
});

test('plantQuestionsForSpecies matches names case-insensitively and trims whitespace', () => {
  const questions = plantQuestionsForSpecies('  Rafflesia tuan-mudae  ');
  assert.ok(questions.length > 0);
  assert.equal(questions[0].question, 'What is Rafflesia tuan-mudae?');
});

test('plantQuestionsForSpecies returns an empty list for unknown or missing species', () => {
  assert.deepEqual(plantQuestionsForSpecies('Unknown plant'), []);
  assert.deepEqual(plantQuestionsForSpecies(null), []);
  assert.deepEqual(plantQuestionsForSpecies(''), []);
});
