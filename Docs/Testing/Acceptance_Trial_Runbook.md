# Acceptance measurement trial runbook (#40 / S2-15)

Drafted to unblock #40: locks the measurement definitions ahead of the actual
sessions, and gives whoever runs the trials (device + participants) a
checklist to execute without having to design anything on the day. Fill in
the dated results table at the bottom once trials are run — that becomes the
retained evidence for #40 and feeds #54 (coverage) and #55 (evidence packaging).

## 1. Definitions (locked before any trial runs)

- **QR timing boundary.** The clock starts when the camera decodes the tag
  and ends when the species record is displayed. Aiming/search time before
  the decoder reads the tag is excluded (matches the issue note). The
  summarizer (`mobile/scripts/summarize_acceptance.py`) only scores this
  against **cached/offline lookups** (`operation=qr_lookup`,
  `outcome=local_found`) — online remote lookups are logged but not compared
  to the 5s target, so trials must include enough *offline* scans to get a
  real sample.
- **Sync success denominator.** Every attempted push counts as one
  `sync_record` row. Successes are rows with `outcome=synced`. Retries after
  a failure are separate attempts (not merged into the original), and
  conflicts count as attempts, not successes — this matches
  `>95% sync success` in Report §7 and the backlog note under S2-15.
- **Usability completion.** A task "completes" only if the participant
  reaches the expected end state unaided (no facilitator intervention beyond
  the fixed task script). Partial completion or a facilitator rescue counts
  as a problem, not a pass — don't equate "the app launched" with usability
  verification.

## 2. What you need before starting

- A test build on the actual device(s) (note build/commit hash and Expo/SDK
  version — needed for the report regardless of pass/fail).
- A Supabase test project reachable from the device, with at least a few
  known species records pre-seeded so offline lookups can resolve locally.
- Wi-Fi toggle access on the device to simulate offline.
- 5 participants for the usability walkthrough (can be reused for QR/sync
  trials if convenient, but log each activity separately).

## 3. QR-lookup trial procedure

1. Pick 3+ known records and make sure they're already cached locally
   (open/view them once while online so the device has a local copy).
2. Turn on airplane mode / disable Wi-Fi.
3. Scan each record's QR code. Repeat each record 3–5 times across the
   session for a reasonable sample (aim for 15+ total offline scans).
4. Also run a handful of **online** scans and a few **unknown/unsupported**
   QR codes, so #66's lookup-state separation (local hit / remote hit /
   not-found / error) has real data behind it, even though only the offline
   ones count toward the 5s target.
5. Do not manually time anything — the app logs `duration_ms` per scan to
   `acceptance_measurements` automatically. Just scan naturally.

## 4. Sync trial procedure

1. While offline, capture at least 3 new records (with photos).
2. Reconnect and trigger sync. Record whether it reports success, failure,
   or a conflict for each record.
3. Deliberately create one conflict if possible (edit the same record from
   two sessions before syncing) so #39's conflict evidence has a real case.
4. Run sync twice in a row after a successful first pass — confirm no
   duplicate records appear (ties back to #23's no-duplicate criterion).

## 5. Five-user usability walkthrough

Fixed task list — same five tasks for every participant, in this order.
Use participant IDs (P1–P5), never names, in the notes.

1. Sign in and capture a new plant record with a photo.
2. Scan an existing record's QR code and view its details.
3. Go offline, capture one more record, then reconnect and sync it.
4. (Officer account) Review and approve/reject a pending submission.
5. Find a specific species in the catalogue using search/filter.

For each participant, record: completion (yes/no/partial), time to
completion if reasonable to capture, any problem encountered (in their own
words if possible), and one anonymised comment. Keep raw notes in a separate
file per participant if useful, but only anonymised summaries go in the
report.

## 6. After the session — pulling the numbers

1. Copy `plantiful.db` off the test device using your normal dev-device
   tooling (e.g. Expo dev client file access, or `adb pull` on Android).
2. Run:
   ```
   python mobile/scripts/summarize_acceptance.py "PATH_TO_plantiful.db" --raw "PATH_TO_events.csv"
   ```
3. Keep both the printed summary and the raw CSV — the CSV is the retained
   evidence the acceptance criteria require, the summary is what goes in the
   report table below.
4. If trials happened on more than one device, run the script per device
   and report each separately (per the issue note — don't merge different
   conditions into one number).

## 7. Results (fill in after each session)

| Metric | Target | Measured | Sample size | Device / build | Date |
|---|---|---|---|---|---|
| Cached QR average (ms) | <5000 | — | — | — | — |
| Cached QR % under 5s | — | — | — | — | — |
| Sync success rate | >95% | — | — | — | — |
| Usability completion (5 tasks × 5 users) | >90% | — | 25 task-attempts | — | — |

Problems observed (usability):
-

Conflicts observed (sync):
-

