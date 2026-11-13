# Android offline AI baseline

## Scope

Target a range of Android manufacturers and chipsets, not one phone model. iOS inference is outside this experiment. These are engineering targets, not a claim of tested device support.

The project declares Expo 58.0.22 and React Native 0.88.1. The versioned Expo 58 reference lists Android 7+ support, compile SDK 37 and target SDK 36. This is the framework baseline only. The final minimum Android version and supported ABIs must also satisfy the selected inference library and the generated release manifest. Do not lower native requirements to bypass incompatibility.

Source checked on 5 November 2026: https://docs.expo.dev/versions/v58.0.0/

## Portable implementation targets

- Use a small image classifier with standard, exportable operations. Compare a MobileNetV3-Small pretrained backbone before considering larger architectures.
- Start with a single still image and 224 by 224 model input, subject to the checkpoint's exact preprocessing requirements. Do not retain full-resolution decoded images alongside repeated inference buffers.
- Evaluate a standalone CPU inference path first. GPU or NPU support is an optional optimisation, never a requirement for basic operation.
- Aim for a model artifact of 10 to 30 MB or less. Compare INT8 with float on held-out data rather than assuming quantisation preserves accuracy.
- Run inference away from the UI thread, allow only one inference at a time, and release model and image resources predictably.
- Package the required model and labels for offline use. Do not depend on a first-use model download, Google Play services or a particular vendor's cloud runtime for the baseline path.
- Record supported ABIs from the selected native runtime. ARM64 is the first physical-device test target. ARMv7 and x86 emulators must not be advertised as supported without compatible runtime binaries and tests.
- A failed or unavailable model must leave capture, local record storage and later sync usable. Model predictions remain provisional.

No inference library or native configuration has been installed or changed in this phase.

## Device test matrix

| Tier | Initial test target | Purpose |
|---|---|---|
| Lower-resource | 3 GB RAM, older supported Android release, CPU only | Memory pressure, cold start, responsiveness |
| Typical | 4 to 6 GB RAM, mid-range chipset | Normal capture and inference workflow |
| Higher-resource | 8 GB RAM or more, recent Android release | Regression checks and optional delegate comparison |

Select physical devices across at least two chipset families and manufacturers when available, for example Qualcomm and MediaTek. Include the oldest final supported OS and a recent OS. These RAM tiers are test targets, not enforced minimums. Emulator success alone cannot establish real-device performance.

Measure model-load time, image decode/preprocessing, warm median and p95 inference, full tap-to-result latency, peak process memory and repeated-run thermal behaviour. The existing 1 to 3 second end-to-end goal remains unverified. Test airplane mode from a fresh install, app restart, repeated captures and reconnect/sync. Keep device model, OS, ABI, build type, model hash and runtime version with every result.

## Next gate

Obtain a useful supported-species model and validate its export before adding native runtime dependencies to the mobile app. Confirm the runtime against Expo 58 and React Native 0.88 documentation, build an Android development client, then test CPU operation across the matrix. Expo Go does not establish compatibility with an added native inference library.
