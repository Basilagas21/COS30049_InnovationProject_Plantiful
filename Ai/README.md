# Plantiful AI

Central index for AI research, datasets, model evaluation and integration records.

## Current decision

Offline identification now has a trained 20-species pilot model. It is not approved for production and it is not integrated into the mobile app. The existing hosted Field Assist workflow still needs connectivity. The pilot is a convenience subset, not full catalogue coverage.

The latest screening found 14 of 263 catalogue names in the PlantNet MobileNet labels and 4 of 263 in the public iNaturalist small model's output labels. BioCLIP offers a broader zero-shot evaluation route, but its published checkpoints exceed the 10 to 30 MB target. A MobileNetV3-Small pilot was therefore fine-tuned on 1,954 deduplicated iNaturalist research-grade photos. It scored 78.8% top-1 and 91.8% top-3 on 293 observation-disjoint test images. These are pilot numbers on automatically filtered labels, not field accuracy and not a full catalogue claim.

- [Training notebook](a.ipynb)
- [Pilot metrics](evaluation/pilot/metrics.json)
- [Pilot model card](evaluation/pilot/model_card.json)
- [Pilot confusion matrix](evaluation/pilot/confusion_matrix.png)
- [Pilot review grid](evaluation/pilot/review_grid.png)
- [Pretrained model investigation](research/pretrained-models.md)
- [Read-only coverage audit](research/audit-coverage.mjs)
- [Android device baseline](research/android-baseline.md)
- [Catalogue dataset availability](datasets/catalogue-availability.json)
- [Pilot species selection](datasets/pilot-species.json)
- [Pilot candidate summary](datasets/pilot-summary.json)
- [Dataset acquisition](#dataset-acquisition)
- [Evaluation](#evaluation)
- [Model artifacts](#model-artifacts)
- [Integration](#integration)
- [Sprint 2 tracker](../Docs/Reports/Sprint2/Additional_Innovation_Tracker.md)

Keep research and evaluation resources here. Runtime modules remain in the web and mobile packages that build them. Do not store credentials here.

## Dataset acquisition

### Catalogue-specific sourcing

The 5 November 2026 iNaturalist availability audit screened all 263 catalogue names. It resolved 252 exact active species names, leaving 11 for taxonomy review. Under the selected filters, 135 species had at least 100 candidate observations and 99 had at least 300. These counts are global observations, not Malaysia-only photographs or confirmed independent training examples.

Filters require research-grade, non-captive observations with photographs licensed CC0, CC BY or CC BY-SA. Photo licences are checked individually when building the manifest. Research grade represents community consensus and still requires label and image review for this project.

A 20-species convenience pilot now has 1,964 candidate-photo metadata rows in `datasets/pilot-candidates.jsonl`. Each row records source observation, photo identifier, image URL, attribution and licence. A bounded batch has been downloaded into ignored `datasets/raw/pilot/`. All 1,964 candidates downloaded without request failures, then SHA256 deduplication retained 1,954 unique images. Observation-grouped splits contain 1,367 train images, 294 validation images and 293 test images. Review status remains pending and labels have not been manually verified. The collector takes the first 100 eligible observations by ID per species and then retains at most one suitable photo from each observation. It is not a random or geographically balanced sample. Exact species matching excludes descendant taxa pending review.

Reproduce from the repository root with Node 22 or newer:

```powershell
node --env-file=web/.env.local Ai/research/audit-dataset.mjs --all
node Ai/research/collect-candidates.mjs
node --test Ai/research/collect-candidates.test.mjs
```

Without `--all`, the audit screens only the first 20 alphabetically sorted names and replaces the report with that limited result. The full audit uses sequential, throttled public API requests and an ignored seven-day cache under `datasets/cache/`. Source observation counts can change. The Supabase catalogue query is read-only, and its credentials are never sent to iNaturalist. Public source documentation is at https://api.inaturalist.org/v1/docs/.

Next, review `datasets/raw/pilot/downloaded.csv` and `evaluation/pilot/review_grid.png` for label correctness and visible plant organs. Any rejected image requires a new deduplicated manifest and a fresh split. Include additional unsupported species and non-plant inputs when evaluating abstention. Obtain local field photographs for a separate domain-shift test. The 20-species list is provisional training scope, not model coverage already delivered.

### PlantNet reference dataset

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

The 20-species pilot was trained for 12 epochs. Validation top-1 reached 76.9%. The held-out observation-grouped test set contained 293 images. Test top-1 was 78.8%, top-3 was 91.8% and macro F1 was 78.8%. The strongest recalls were Dicranopteris linearis 100%, Arundina graminifolia 93.3%, Casuarina equisetifolia 93.3%, Clitoria ternatea 93.3% and Etlingera elatior 93.3%. The weakest were Acacia auriculiformis 46.7%, Terminalia catappa 53.3%, Acacia mangium 60.0%, Chromolaena odorata 66.7% and Senna alata 66.7%.

These results are not a field-accuracy claim. Labels were not manually verified. The test set shares the iNaturalist photo domain. Unsupported species and non-plant abstention have not been measured. The model has not been tested on local phone photographs.

Reproduce with the notebook. The smoke run uses 8 images per class and one epoch. The full run uses all candidates, 12 epochs and early stopping.

```powershell
python Ai/training/build_a_notebook.py
$env:PLANTIFUL_SMOKE='1'; python -m nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=1800 --ExecutePreprocessor.kernel_name=python3 Ai/a.ipynb
Remove-Item Env:PLANTIFUL_SMOKE
python -m nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=10800 --ExecutePreprocessor.kernel_name=python3 Ai/a.ipynb
```

- Verify checkpoint hash, exact label order, preprocessing and redistribution terms.
- Audit catalogue coverage, including reviewed synonyms.
- Compare floating-point and quantised outputs on the same held-out images.
- Measure top-1 and top-3 accuracy, per-species recall and confusion pairs.
- Test unsupported plants and non-plant inputs. Softmax confidence does not prove that an input is supported.

Initial targets are a model around 10 to 30 MB and end-to-end identification around 1 to 3 seconds on a lower-end supported phone. These are targets, not measured promises or final acceptance thresholds.

Record OS, hardware, runtime, compute delegate, model hash, preprocessing time, cold-load time, warm median and p95 latency, peak memory, failures and repeated-run behaviour. Test lower-, middle- and higher-performance devices within the app's supported baseline. File size is not runtime memory use.

Verify airplane-mode capture, inference, local persistence, app restart, reconnect, sync and officer review. Keep publisher benchmarks separate from Plantiful measurements.

## Model artifacts

No model is selected or bundled in the app. A local pilot artifact exists under ignored `models/pilot/`. It contains `best.pt` at 6,277,289 bytes and a TorchScript export at 6,660,648 bytes. ONNX export was skipped because the local `onnx` package could not import `onnx.defs`, and the model card records that failure. The checkpoint and TorchScript files are not committed.

Before retaining a production model, record its source revision, filename, SHA256, byte size, licence, dataset version, ordered labels, preprocessing, tensor shapes and quantisation parameters.

Store local binaries under ignored `models/`. Do not assign a model card's metrics to a differently named artifact without verification.

## Integration

The inspected mobile package uses Expo 58.0.22 and React Native 0.88.1. It declares no on-device inference dependency. No offline integration has been attempted. The pilot artifact still needs conversion to an Android runtime supported by an Expo development build, followed by device latency, memory and field-photo testing.

The versioned Expo 58 documentation lists Android 7+ as its framework baseline. The final minimum OS and processor architectures must also satisfy the selected inference runtime and release manifest. See the [Android baseline](research/android-baseline.md) for CPU-first operation and a lower-, middle- and higher-resource device test matrix. Phone release year is not a support baseline. A development build is expected if native modules are unavailable in Expo Go.

Current hosted identification uses `mobile/src/lib/field-assist.ts` and `web/src/app/api/field-assist/`. Those remain runtime files in their application packages.

After feasibility checks pass, implement local preprocessing, inference, result provenance, persistence, sync and officer review. Preserve model version and evidence identity. Keep human decisions separate from model predictions.
