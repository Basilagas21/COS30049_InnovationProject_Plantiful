# Pretrained offline model investigation

Research date 5 November 2026. No model binaries or image archives downloaded. No inference benchmark performed.

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

## Sources

- https://huggingface.co/cpoisson/plantnet300k-mobilenetv3-small
- https://huggingface.co/api/models/cpoisson/plantnet300k-mobilenetv3-small/tree/main
- https://github.com/plantnet/PlantNet-300K
- https://raw.githubusercontent.com/plantnet/PlantNet-300K/main/legacy_v1/README.md
- https://huggingface.co/litert-community/PlantNet-300K-ResNet18-LiteRT
- https://zenodo.org/api/records/10419064
