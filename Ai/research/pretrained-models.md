# Pretrained offline model investigation

Research date 5 November 2026. No pretrained candidate binary or PlantNet image archive from this note was downloaded. The separate 20-species pilot downloaded iNaturalist candidate images and used torchvision ImageNet weights. See `Ai/a.ipynb` for that run.

## Candidate comparison

| Candidate | Verified source information | Current assessment |
|---|---|---|
| cpoisson PlantNet MobileNetV3-Small | Repository lists `plantnet_mobilenetv3.onnx` at 10,513,153 bytes and `plantnet_mobilenetv3_int8.onnx` at 2,801,195 bytes. Label JSON has 1,081 entries | Best initial size candidate, but coverage, licensing and version correspondence unresolved |
| PlantNet-300K legacy official models | Official legacy README links pretrained checkpoints and demonstrates ResNet18 with 1,081 classes | Useful reference for original training and class mapping. Not yet verified as a mobile artifact |
| litert-community PlantNet ResNet18 | Model card advertises a 47 MB LiteRT model with 1,081 species and Android measurements | Larger comparison candidate. Publisher timings do not establish Plantiful latency or broad phone support |
| Official PlantNet-300K-v2 models | Official repository publishes ConvNeXt and ViT models for 1,000 classes | Research reference. Different label space from the 1,081-class legacy candidates |
| PlantVillage MobileNet models | Search results predominantly describe crop-disease classifiers | Wrong primary task for forest species identification |

## Important MobileNet qualification

The card reports 75.45% test top-1 and 93.81% top-5 for a v2 checkpoint. These are publisher claims, not Plantiful measurements. They must not be assigned to the listed INT8 file without confirming artifact lineage and rerunning evaluation.

The README names `mobilenetv3_small_v2.onnx`, but the inspected repository listing instead contains `plantnet_mobilenetv3.onnx`, alongside a v2 PyTorch checkpoint. Its dataset counts differ from the official legacy dataset. The card declares OpenRAIL but the inspected root listing does not include a standalone licence file. Resolve exact terms, checkpoint lineage, preprocessing and class-index ordering before redistribution or integration.

## Catalogue coverage audit

Reproducible audit completed at 2026-11-05T01:04:21Z. The current catalogue contained 263 distinct scientific names. Of these, 14 had direct name matches in the candidate's 1,081 label entries, approximately 5.3%. The other 249 require synonym review or are outside the listed coverage. This poor initial overlap blocks selection as a general catalogue identifier.

A read-only authenticated query retrieved current scientific names from the configured Supabase project. No records were modified and no credentials were printed. Compared names against the candidate label JSON using case-insensitive exact matching or a name followed by a space for botanical authorship.

Initial matches include Nepenthes mirabilis, Dischidia nummularia, Morinda citrifolia, Acacia mangium, Peperomia pellucida, Oldenlandia corymbosa, Asystasia gangetica, Phyllanthus urinaria, Acacia auriculiformis, Dendrobium crumenatum, Alocasia longiloba, Acalypha hispida, Alocasia macrorrhizos and Casuarina equisetifolia.

No direct match was found for Rafflesia tuan-mudae, Nepenthes lowii or Shorea macrophylla. Some labels have duplicate names with different author formatting. Synonyms and the model output-index mapping remain unverified. This is a label-screening result, not a definitive botanical coverage judgement or accuracy test.

Reproduce the audit from the repository root with `node --env-file=web/.env.local Ai/research/audit-coverage.mjs`. The live source can change. Pin source revisions and archive reviewed metadata before a benchmark release.

## Decision

Do not select MobileNet solely for its small file size. Resolve catalogue coverage and the artifact discrepancies first. Do not substitute the newer 1,000-class v2 metadata for a 1,081-class model. Search broader plant-specific pretrained models if relevant coverage remains inadequate. A limited supported-species demonstration would require an explicit scope decision.

## Follow-up screening on 5 November 2026

| Candidate | Source facts checked in this pass | Plantiful assessment |
|---|---|---|
| iNaturalist public small model, release `v25.01.15` | Android `INatVision_Small_2_fact256_8bit.tflite` is 22,197,168 bytes. The official Seek setup references this release family. The model-files README says public small models cover approximately 500 taxa and full species models remain private | Fits the initial download-size target, but only 4 catalogue names match the 507 output-label entries. Not a general catalogue solution |
| BioCLIP | Official model card describes a ViT-B/16, MIT-licensed model trained on TreeOfLife-10M covering over 450K taxa. Published `open_clip_pytorch_model.bin` is 598,599,013 bytes | Useful desktop zero-shot evaluation candidate, not an approved phone bundle |
| BioCLIP 2 | Official card describes a ViT-L/14, MIT-licensed model trained on TreeOfLife-200M. Published `open_clip_model.safetensors` is 1,710,517,724 bytes | Desktop comparison or potential teacher for later distillation. Published checkpoint exceeds the mobile size target |

The BioCLIP sizes are full published checkpoints, not measured image-only mobile exports. Precomputing text embeddings could remove the text encoder from a deployed classifier, but no export, quantisation, latency measurement or memory measurement has been performed. Accepting arbitrary species names as prompts is not proof of training coverage or recognition accuracy. Restricting prompts to the catalogue can still force an unsupported plant into an incorrect catalogue choice.

### iNaturalist coverage result

Read-only audit completed at `2026-11-05T01:50:37.896Z` against 263 distinct catalogue names. Only taxonomy rows with nonnegative integer `leaf_class_id` were treated as candidate output labels. Ancestor taxonomy nodes were excluded from the count.

- Output-label entries screened: 507.
- Catalogue names matched: 4, approximately 1.5%.
- Matches: Oxalis corniculata, Bidens alba, Ricinus communis and Lantana camara.
- Metadata SHA256: `7df72a7a05afe53f20344339552b6c980423e1bd25e5cc69587f4f4619edc0e8`.
- Metadata source: `https://github.com/inaturalist/model-files/releases/download/v25.01.15/taxonomy.json`.

Reproduce with `node --env-file=web/.env.local Ai/research/audit-coverage.mjs inaturalist`. The default argument remains `plantnet`. Both modes report the downloaded metadata hash. Catalogue data can change. Synonyms, model tensor correspondence and iNaturalist weight redistribution terms remain unverified. No model binary was downloaded.

### Pilot training result

The recommended transfer-learning experiment was run for the convenience pilot. The notebook `Ai/a.ipynb` downloaded 1,964 candidate photos, deduplicated them to 1,954, split by observation into 1,367 train, 294 validation and 293 test, and fine-tuned MobileNetV3-Small at 224 by 224 for 12 epochs. Validation top-1 was 76.9%. Test top-1 was 78.8%, top-3 was 91.8% and macro F1 was 78.8%.

This is a pilot result over 20 species. It does not establish full catalogue coverage, field accuracy, unsupported-species abstention or Android latency. Labels were automatically filtered iNaturalist research-grade names and were not manually verified. The test set shares the iNaturalist photo domain. Model artifacts are local and ignored under `Ai/models/pilot/`. ONNX export was not produced because the local `onnx` install could not import `onnx.defs`. A PyTorch checkpoint and TorchScript export exist.

### Next gates after the pilot

Neither screened small pretrained model provides adequate direct coverage for general identification across the current catalogue. The pilot tests transfer learning on 20 species. It does not establish general catalogue support.

1. Review `Ai/evaluation/pilot/review_grid.png` and correct or remove mislabelled images.
2. Add unsupported plants and non-plant inputs, then calibrate an abstention threshold on validation data.
3. Collect local field photographs from multiple Android phones and lighting conditions.
4. Convert the pilot artifact to an Android runtime supported by an Expo development build, then measure cold start, warm latency, memory and model size.
5. Integrate only after useful held-out field recognition and device performance are demonstrated. Hosted Field Assist remains the existing online path.

The pilot remains a 20-species demonstration, not a claim that all 263 species can be supported.

## Sources

- https://huggingface.co/cpoisson/plantnet300k-mobilenetv3-small
- https://huggingface.co/api/models/cpoisson/plantnet300k-mobilenetv3-small/tree/main
- https://github.com/plantnet/PlantNet-300K
- https://raw.githubusercontent.com/plantnet/PlantNet-300K/main/legacy_v1/README.md
- https://huggingface.co/litert-community/PlantNet-300K-ResNet18-LiteRT
- https://zenodo.org/api/records/10419064
- https://github.com/inaturalist/model-files
- https://github.com/inaturalist/model-files/releases/tag/v25.01.15
- https://raw.githubusercontent.com/inaturalist/SeekReactNative/main/README.md
- https://huggingface.co/imageomics/bioclip
- https://huggingface.co/api/models/imageomics/bioclip/tree/main
- https://huggingface.co/imageomics/bioclip-2
- https://huggingface.co/api/models/imageomics/bioclip-2/tree/main
