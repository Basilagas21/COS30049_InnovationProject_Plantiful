# Additional Innovation evaluation

## Current boundary

The implementation and fixture tests do not establish species accuracy or improved fieldwork outcomes. No labelled live provider benchmark or participant trial has been recorded here. The empty templates are intentional.

## Provider benchmark

Create an observation manifest based on `observations.template.json`. Each observation must contain the fields below. Replace every placeholder before running. All photographs in one observation must show the same plant individual.

```json
[
  {
    "id": "REPLACE_ME",
    "scientificName": "REPLACE_ME",
    "acceptableNames": [],
    "verifier": "REPLACE_ME",
    "provenance": "REPLACE_ME",
    "individualId": "REPLACE_ME",
    "split": "pilot",
    "supported": true,
    "images": ["photos/REPLACE_ME.jpg"]
  }
]
```

Use `supported` for inclusion in the target Plantiful catalogue, not an assumed provider capability. Include similar species, difficult photographs and plants outside that target catalogue. Have a qualified reviewer establish the labels. Record reviewed alternative names explicitly. Keep individuals separate between pilot selection and final evaluation. Keep image permissions with the dataset.

From `web`, validate without sending images.

```powershell
node --import tsx scripts/field-assist-benchmark.ts ../Docs/Testing/Additional_Innovation/observations.template.json
```

The empty template is rejected until real observations are supplied. Set provider keys locally and set `AI_BENCHMARK_PROVIDERS` to `plantnet`, `kindwise` or `plantnet,kindwise`. A live run sends the photographs and consumes provider quota.

```powershell
node --import tsx scripts/field-assist-benchmark.ts ../Docs/Testing/Additional_Innovation/observations.json --live --output=../Docs/Testing/Additional_Innovation/results.json
```

The output retains hashes, provider version when exposed, scores, failures, latency and per-species results. Pilot and evaluation summaries remain separate. Top-1 and top-3 denominators include all submitted cases, including failures. Cost remains null until reconciled with provider billing. Do not replace missing values with zero. Check class balance and limitations before interpreting aggregate accuracy.

## Participant comparison

Recruit volunteers who did not implement the screens. Use anonymous participant IDs and test accounts. Explain the task and ask permission before capturing screens or comments.

Use equivalent observations under three conditions where feasible.

1. Manual catalogue lookup and the existing capture form.
2. Capture with the evidence checklist.
3. Checklist with AI suggestions.

Alternate condition order. Avoid showing the same plant to a participant repeatedly unless the study explicitly accounts for memory effects. Record completed, assisted, failed and not-attempted outcomes in `participant-results.csv`. Preserve timing for failed tasks separately. Ask task ease from 1 for very difficult to 5 for very easy. This is not a SUS score.

Measure time to a complete record, final identification correctness, missing evidence, officer correction count and acceptance of an incorrect AI suggestion. Have the reviewer assess evidence using the same criteria across conditions. Describe the participant count, recruitment and expertise. Do not claim general forest performance from a small convenience sample.

## Device and integration checks

| ID | Procedure | Expected outcome |
|---|---|---|
| AI-01 | Capture without network and leave evidence incomplete | Local save remains available and no AI result is invented |
| AI-02 | Cycle an optional organ status, save, reopen and sync | Declaration persists in notes and is distinguished from photo analysis |
| AI-03 | Request suggestions before upload | Upload requirement is explicit |
| AI-04 | Upload photos and request identification | Provider, candidates, scores and evidence version are retained |
| AI-05 | Repeat the same request | Stored result is reused without another provider call |
| AI-06 | Simulate provider timeout, rejection and quota exhaustion | Clear retry or no-match state, observation remains intact |
| AI-07 | Replace analysed photo bytes at the same path | Earlier attempt becomes stale and decisions are rejected |
| AI-08 | Try another user's record or spoof a reviewer decision | Backend denies the operation |
| AI-09 | Select a provisional match and later correct it as officer | Both decisions remain in history, approval and publication remain separate |
| AI-10 | Reopen cached history without network | Cached status is explicit and online decision actions are disabled |
| AI-11 | Publish reviewed guidance and a verified alias | New identification results use them, older attempts retain their original snapshot |

Record device, revision, migration version, timestamp and outcome for each trial. Fixture tests are separate from these phone and live-system checks.

## Load and operating cost

Record backend instance configuration, request count, concurrency, input image size, cache-hit rate, failures, latency distribution and provider cost. Begin with mocked provider responses to avoid exhausting quota. Only run live load within the agreed account limits. The initial implementation admits up to 20 attempts per user and 400 total attempts in a rolling 24-hour period. These limits are not measured throughput claims.
