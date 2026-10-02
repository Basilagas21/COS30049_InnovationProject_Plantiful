# AI Modules

Prototype area for the Optional Additional Innovation (Objective 5) described in
[Docs/Reports/System_Proposal_Report.md](../Docs/Reports/System_Proposal_Report.md).

## Status

**Planned only. Not started.**

This folder is currently empty. The automated species identification work it
would hold is explicitly out of scope for the core system
(System_Proposal_Report.md Section 2.3.2). It is treated as the Optional
Additional Innovation and is only pursued if the team confirms the intended
approach with the project tutor early in the trimester (Section 2.3.2 and 5.1).

## Purpose

The proposed innovation is an assisted ground-truthing workflow for botanists in
the field. Instead of relying on memory or a paper key, a botanist photographs a
plant and receives a shortlist of candidate species based on image recognition.
The botanist still makes the final identification, so the AI module acts as a
suggestion layer on top of the validated human workflow, not as a replacement.

## Proposed Scope (if approved)

| Area | Intended work |
|---|---|
| Image recognition model | Species classifier trained on local flora common to Niah National Park |
| Candidate shortlist | Confidence-ranked species suggestions for the botanist to confirm or reject |
| Integration point | Companion or embedded module alongside the mobile field app (mobile/) |
| Evaluation | Accuracy and time-to-identify measured against manual identification |

## Out of Scope

- Fully automated final identification without a botanist in the loop
- General biodiversity recognition beyond the target species set
- Any change to the core record, review, and publish workflow

## Deliverable

If pursued, the corresponding deliverable is the optional ground-truthing
workflow write-up and evaluation (System_Proposal_Report.md Section 5.1). A
working demo of the image recognition prototype is expected to support it.

## Getting Started

No code exists yet. When development begins, add runnable experiments here with
a short description per subfolder. Training data and model weights must not be
committed to the repository and should be referenced through
`.env`-style local configuration only.