export type EvaluationRow = {
  observationId: string; species: string; supported: boolean; status: 'success' | 'no_match' | 'failed';
  candidates: string[]; acceptableNames: string[]; durationMs: number; cost: number | null;
};
export function summariseEvaluation(rows: EvaluationRow[]) {
  const normal = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();
  const correct = (row: EvaluationRow, k: number) => row.status === 'success' && row.candidates.slice(0, k)
    .some(candidate => row.acceptableNames.map(normal).includes(normal(candidate)));
  const durations = rows.map(r => r.durationMs).sort((a, b) => a - b);
  const n = rows.length;
  return {
    observations: n,
    denominator: 'All submitted independently labelled observations, including failures and no-match responses',
    top1Correct: rows.filter(row => correct(row, 1)).length,
    top3Correct: rows.filter(row => correct(row, 3)).length,
    top1Accuracy: n ? rows.filter(row => correct(row, 1)).length / n : null,
    top3Accuracy: n ? rows.filter(row => correct(row, 3)).length / n : null,
    failed: rows.filter(row => row.status === 'failed').length,
    noMatch: rows.filter(row => row.status === 'no_match').length,
    medianDurationMs: n ? (durations[Math.floor((n - 1) / 2)] + durations[Math.floor(n / 2)]) / 2 : null,
    measuredCost: rows.every(r => r.cost !== null) ? rows.reduce((sum, row) => sum + row.cost!, 0) : null,
    outsideTargetCatalogue: rows.filter(row => !row.supported).length,
    perSpecies: Object.fromEntries([...new Set(rows.map(r => r.species))].map(species => {
      const group = rows.filter(row => row.species === species);
      return [species, { attempts: group.length, top1Correct: group.filter(row => correct(row, 1)).length, top3Correct: group.filter(row => correct(row, 3)).length }];
    })),
  };
}
