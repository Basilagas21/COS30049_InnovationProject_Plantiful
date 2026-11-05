# Plantiful AI

Central index for AI research, datasets, model evaluation and integration records.

## Current decision

Offline identification is in feasibility research. No model is approved or integrated. The existing hosted Field Assist workflow still needs connectivity. Lightweight model files exist, but catalogue coverage and artifact provenance must be resolved before integration.

The latest screening found 14 of 263 catalogue names in the PlantNet MobileNet labels and 4 of 263 in the public iNaturalist small model's output labels. BioCLIP offers a broader zero-shot evaluation route, but its published checkpoints exceed the 10 to 30 MB target. The proposed next experiment is a lightweight pretrained backbone fine-tuned on confirmed photographs of an explicitly supported local-species set. This requires a scope decision and labelled images before training.

- [Pretrained model investigation](research/pretrained-models.md)
- [Read-only coverage audit](research/audit-coverage.mjs)
- [Dataset acquisition](#dataset-acquisition)
- [Evaluation](#evaluation)
- [Model artifacts](#model-artifacts)
- [Integration](#integration)
- [Sprint 2 tracker](../Docs/Reports/Sprint2/Additional_Innovation_Tracker.md)

Keep research and evaluation resources here. Runtime modules remain in the web and mobile packages that build them. Do not store credentials here.

## Dataset acquisition

An unchanged pretrained model does not need a training dataset, but evaluation requires independently confirmed labels.

The [official PlantNet-300K-v2 inventory](https://zenodo.org/api/records/10419064), checked on 5 November 2026, lists the following files. None of the image archives has been downloaded.

| File | Bytes |
|---|---:|
| species_metadata.csv | 106651 |
| plantnet300K_metadata.csv | 27738434 |
| images.zip | 41819638938 |

The image archive is approximately 41.8 GB before extraction. Inspect metadata first.

1. Verify the candidate's dataset version and class mapping, then check catalogue overlap.
2. Resolve model and image licences independently. The Zenodo record's CC BY licence does not replace individual image terms and attribution.
3. Obtain an official held-out test subset where possible. Check storage before full-archive acquisition.
4. Record image identifier, observation group, scientific name, source, licence, author, split and file hash in a manifest.
5. Supplement with confirmed local field photographs, unsupported plants and non-plant inputs.

Do not mix v2's 1,000-class metadata with a legacy 1,081-class model. Do not use collector guesses as ground truth. Keep images from the same observation together when splitting local data. Tune thresholds on validation data and freeze them before final testing.

Store large downloads in ignored `datasets/raw/` or `datasets/cache/`. Track manifests and source instructions in Git.

## Evaluation

No performance results have been measured yet.

- Verify checkpoint hash, exact label order, preprocessing and redistribution terms.
- Audit catalogue coverage, including reviewed synonyms.
- Compare floating-point and quantised outputs on the same held-out images.
- Measure top-1 and top-3 accuracy, per-species recall and confusion pairs.
- Test unsupported plants and non-plant inputs. Softmax confidence does not prove that an input is supported.

Initial targets are a model around 10 to 30 MB and end-to-end identification around 1 to 3 seconds on a lower-end supported phone. These are targets, not measured promises or final acceptance thresholds.

Record OS, hardware, runtime, compute delegate, model hash, preprocessing time, cold-load time, warm median and p95 latency, peak memory, failures and repeated-run behaviour. Test lower-, middle- and higher-performance devices within the app's supported baseline. File size is not runtime memory use.

Verify airplane-mode capture, inference, local persistence, app restart, reconnect, sync and officer review. Keep publisher benchmarks separate from Plantiful measurements.

## Model artifacts

No model is selected or bundled. Before retaining one, record its source revision, filename, SHA256, byte size, licence, dataset version, ordered labels, preprocessing, tensor shapes and quantisation parameters.

Store local binaries under ignored `models/downloads/`. Do not assign a model card's metrics to a differently named artifact without verification.

## Integration

The inspected mobile package uses Expo 58.0.22 and React Native 0.88.1. It declares no on-device inference dependency. No offline integration has been attempted.

Minimum OS, processor architecture and runtime compatibility remain unresolved. Check matching Expo and runtime documentation before changing native dependencies. Phone release year is not a support baseline. A development build is expected if native modules are unavailable in Expo Go.

Current hosted identification uses `mobile/src/lib/field-assist.ts` and `web/src/app/api/field-assist/`. Those remain runtime files in their application packages.

After feasibility checks pass, implement local preprocessing, inference, result provenance, persistence, sync and officer review. Preserve model version and evidence identity. Keep human decisions separate from model predictions.
