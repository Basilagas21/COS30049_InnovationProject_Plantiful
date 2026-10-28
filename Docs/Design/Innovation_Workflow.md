# Assisted Ground-Truthing Workflow

**Optional Additional Innovation (Objective 5)**

**Unit Code:** COS30049
**Unit Name:** COMPUTING TECHNOLOGY INNOVATION PROJECT
**Group Name:** Plantiful (Group 7)

---

### Document Control

| Version | Date | Author | Status | Notes |
|---|---|---|---|---|
| 1.0 | 15 October 2026 | Group 7 | Draft | Initial write-up and evaluation plan for the optional assisted ground-truthing workflow (Objective 5). |

---

## 1. Purpose

This document is the optional deliverable named in the System Proposal (Section 5.1):
an **innovative ground-truthing workflow write-up and evaluation** (Objective 5). It
describes how the core Plantiful system is extended with an *assisted* identification
step that helps a botanist move from a physical specimen to a recorded species faster
and with fewer transcription errors, while keeping a human responsible for the final
identification.

The write-up is deliberately explicit about what is implemented and what remains
proposed, so the reader can tell design intent from delivered behaviour. Section 7
records the current status.

## 2. The ground-truthing bottleneck

Ground truthing is the act of confirming, in the field, what a plant actually is.
Today a botanist identifies a specimen from memory or a paper key, then writes the
result on a form that is entered into a database later. Two costs follow:

- **Time.** Comparing a specimen against a key is slow, and the same work is repeated
  for every plant visited.
- **Errors.** The handwritten-to-database step is where transcription mistakes and
  inconsistent naming enter the record.

The core system already removes the second cost by capturing records digitally and
offline. The innovation targets the first: giving the botanist a *shortlist of
candidates* at the moment of capture, based on the specimen in front of them, so the
decision is a confirmation rather than a recall.

## 3. Workflow

The workflow is a single path from specimen to approved, published record. It reuses
the existing capture, sync, and review stages and inserts one new step, **Suggest
species**, after the photograph and structured attributes are captured.

1. **Capture the specimen.** The botanist scans the plant's QR tag (or tags a new
   plant) and photographs the specimen in `mobile/src/app/capture/new.tsx`.
2. **Record structured attributes.** Alongside the photo, the botanist records the
   per-record ground-truthing attributes now supported by the schema and app:
   field taxonomy (`taxonomy`), phenology stage (`phenology`), stem diameter
   (`dbh_cm`), height, morphology, notes, and GPS.
3. **Suggest species.** The app proposes a confidence-ranked shortlist of candidate
   species. Each candidate carries a species name, a confidence score, and the source
   of the suggestion (model or catalogue). This is the new step.
4. **Botanist confirms.** The botanist accepts a candidate, picks a different species
   from the full catalogue, or records the specimen as unidentified. The botanist
   always makes the final call; the shortlist is advice, never an automatic result.
5. **Queue and sync.** The record is stored locally in SQLite and pushed to the central
   database when connectivity returns, exactly as other records are.
6. **Officer review and approval.** The record enters the same approval gate as every
   other capture. An officer can approve, reject, or send it back. Suggestions never
   bypass this gate.
7. **Feedback.** Each confirmed identification is a labelled example. Over time these
   examples become the training and evaluation set for the suggestion model, so the
   system improves with use.

The human-in-the-loop step (4) is the design centre of the workflow. The innovation is
not automated identification; it is a shorter, more reliable confirmation step.

## 4. Architecture and integration points

The workflow is a thin layer over the existing system rather than a parallel pipeline.

| Layer | Existing component | Innovation change |
|---|---|---|
| Mobile capture | `mobile/src/app/capture/new.tsx`, `discover.tsx` | Add a "Suggest species" step that shows candidate chips above the species picker |
| Local store | `mobile/src/db.ts`, `mobile/src/lib/database.types.ts` | Store the accepted species and, optionally, the suggested candidate for later analysis |
| Suggestion service | (new) | Produce the candidate shortlist; see options below |
| Sync | `mobile/src/app/(tabs)/sync.tsx` | Unchanged; suggestions travel with the record |
| Review | `web/src/app/approvals`, `web/src/lib/records.ts` | Unchanged; the approval gate is the same for suggested and manual records |
| Data model | `plant_records` (`taxonomy`, `phenology`, `dbh_cm`) | Provides the structured ground-truth attributes the shortlist is scored against |

### 4.1 Suggestion service options

Three approaches produce the shortlist, in increasing order of effort and payoff. They
are compatible: a low-effort option can ship first and be replaced later.

| Option | How it works | Offline | Effort | Trade-off |
|---|---|---|---|---|
| A. Catalogue shortlist | Filter the species catalogue by the recorded taxonomy, phenology, and morphology keywords | Yes | Low | No image understanding; depends on the botanist's own descriptive input |
| B. On-device model | Bundle a compact classifier (TensorFlow Lite / Core ML) trained on Niah flora; score candidates on the device | Yes | High | Fits the offline-first requirement; larger app, model maintenance |
| C. Server-side inference | Send the photo to a backend inference endpoint when online | No | Medium | Simplest to update; unusable in the field without connectivity, so it must degrade to A |

Given the project's offline-first requirement, **Option A is the low-risk baseline and
Option B is the target**. Option C is only worth it as a fallback for office use.

### 4.2 Candidate data contract

Suggestions are plain data, so they are easy to test and to ignore:

```
Candidate {
  species_id: string
  scientific_name: string
  confidence: number   // 0..1; 1.0 for a catalogue-exact match
  source: "catalogue" | "model"
}
```

The app renders the top candidates and records which one, if any, the botanist chose.
Recording the chosen candidate next to the confirmed species is what makes the
evaluation in Section 6 possible.

## 5. Design principles

- **Human in the loop.** The botanist confirms; the system only suggests.
- **Offline first.** The shortlist must work with no connectivity, so the baseline is
  computed on device from data already on device.
- **No new access path.** Suggestions are captured in the same record and pass through
  the same row-level security and officer approval as any other capture.
- **Graceful degradation.** If the model or catalogue is unavailable, the workflow falls
  back to the current manual species picker with no loss of function.
- **Privacy by default.** Only species-relevant data is used. No staff or visitor
  identity data reaches the suggestion service.

## 6. Evaluation plan

The workflow is evaluated against the manual identification it replaces, using the
records themselves as the source of truth.

| Measure | Definition | Target |
|---|---|---|
| Top-1 accuracy | Share of records where the botanist's confirmed species is the first suggestion | Reported; no hard gate for the baseline |
| Top-3 accuracy | Share of records where the confirmed species appears anywhere in the shortlist | ≥ 80% before the model is considered useful |
| Time-to-identify | Median seconds from opening the capture form to confirming a species, versus the manual baseline | Measurable reduction |
| Acceptance rate | Share of records where a suggested species is accepted unchanged | Reported per species |
| Correction rate | Share where the botanist picks a non-suggested species | Trend downwards over time |
| Usability | Task-completion and a short post-trial survey with a botanist | Positive, no blocking issues |

Method: hold out a set of confirmed records, replay them through the suggestion
service, and compare the shortlist against the recorded ground truth. Accuracy is
reported overall and broken down by species, so a single common species cannot hide
poor performance on rare ones.

## 7. Current status

| Element | Status |
|---|---|
| Workflow design (this document) | Complete |
| Per-record ground-truth attributes (`taxonomy`, `phenology`, `dbh_cm`) | Implemented in the mobile app, database schema, and web record view |
| Candidate shortlist (Options A/B/C) | Proposed; not yet built |
| Suggestion model (`AI modules/`) | Not started; the folder documents the intended scope |
| Evaluation harness | Not started; the plan in Section 6 is ready to implement |

The data foundation is in place: records captured from this point carry the structured
attributes the shortlist and the evaluation are scored against. The suggestion service
and the evaluation harness are the remaining work and are scoped as the optional
innovation, pursued only with the tutor's confirmation (System Proposal Section 2.3.2).

## 8. Risks and limitations

- **Training data volume.** A useful model needs many confirmed records per species.
  Until then, only the catalogue baseline (Option A) is realistic.
- **Model size on device.** A classifier large enough to be accurate may be too large to
  bundle; this is the main reason Option B is a target rather than a baseline.
- **Rare-species imbalance.** Rare and endangered species are, by definition, rare in the
  data. Accuracy targets must be reported per species, not only in aggregate.
- **Over-trust.** A confident-looking suggestion can bias a botanist. The confirmation
  step and the correction-rate metric exist to detect and limit this.
- **Scope.** This is an optional innovation. It must not delay the mandatory core
  system, and it is only pursued with the tutor's agreement.

## 9. Deliverable mapping

This document satisfies the optional deliverable in System Proposal Section 5.1
("Innovative ground-truthing workflow write-up and evaluation, Objective 5"). A working
suggestion prototype and measured evaluation results would complete the deliverable if
the innovation is approved.
