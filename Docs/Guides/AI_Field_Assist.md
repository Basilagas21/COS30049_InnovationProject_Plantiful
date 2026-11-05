# AI Field Assist

## Purpose and status

AI Field Assist extends the offline ground-truthing workflow with evidence checks, hosted plant-identification suggestions and separate collector and officer decisions. Issues #76 through #84 track the optional Additional_Innovation scope.

The implementation is in the working tree. The database migration has not been applied to the deployed Supabase project. No real identification, participant benefit or species-accuracy result is claimed. The benchmark and participant templates are prepared under [Additional Innovation testing](../Testing/Additional_Innovation/README.md). Development check outcomes and retests are recorded in the [verification record](../Testing/Additional_Innovation/Verification.md).

## User workflow

1. Capture a tagged observation or a new discovery offline.
2. Review photo, coordinates, reported GPS accuracy, identification and descriptive-notes presence.
3. Optionally declare leaf, bark or stem, flower, fruit and whole-plant views as photographed or unavailable. These declarations are stored in Notes and remain editable. They are not AI organ classifications.
4. Save even if evidence is incomplete. Existing field validation still applies.
5. Sync the observation and photographs when connected.
6. Open record details and request suggestions. The first five uploaded photographs ordered by photo ID are used. They must show the same plant individual.
7. Inspect candidates and relevant reviewed guidance. Select a provisional candidate, another catalogue species or keep the observation unidentified.
8. An officer opens the AI review link from Approvals and records a separate identification decision or evidence request.

Identification history does not silently overwrite the observation species assignment. Approval and publication continue through their existing controls. A recorded evidence request appears in history, not as a push notification. An external candidate does not create a catalogue species.

## Architecture

```mermaid
flowchart TD
  Capture[Mobile offline capture and checklist] --> Local[SQLite record and local photos]
  Local --> Sync[Existing upload and sync]
  Sync --> Request[Authenticated identification request]
  Request --> Access[Owner and record access checks]
  Access --> Evidence[Read bounded storage images and hash evidence]
  Evidence --> Reserve[Atomic reservation, deduplication and quota]
  Reserve --> Archive[Private content-addressed photo archive]
  Archive --> Provider[Pl@ntNet or Kindwise adapter]
  Provider --> Attempts[Normalised candidates and immutable attempt history]
  Attempts --> Collector[Collector provisional decision]
  Collector --> Officer[Officer decision and original-photo inspection]
  Officer --> History[Append-only decision history]
```

The service reads only the configured Supabase storage origin and photo bucket. It checks the record folder before downloading. JPEG and PNG signatures are validated. Each image is limited to 5 MB and a request to 15 MB. Image content hashes, the record snapshot and the photo inventory form the evidence fingerprint. A same-path replacement is detected on history refresh and before decisions.

Archived copies are stored privately in `ai-evidence`, addressed by record and content hash. Uploads do not overwrite existing archived objects. Authorised reviewers receive five-minute signed preview URLs. Refresh renews them. This preserves the original analysed images if the working photos change.

Requests are synchronous with bounded timeouts. Processing state persists before calling the provider. An interrupted processing attempt becomes failed when the next reservation runs after three minutes. Retrying retains the earlier failure. Completed results for identical evidence and provider are reused. A future model refresh requires a separately designed forced-refresh policy.

The database serialises request admission across backend instances. Initial limits are 20 attempts per user and 400 total attempts in a rolling 24 hours, with one active attempt per user. Provider-side quotas still apply and may also be consumed by other applications or benchmark runs.

## Provider research

Official sources were checked on 4 November 2026. Terms and pricing can change.

| Item | Pl@ntNet | Kindwise plant.id |
|---|---|---|
| Initial role | Initial implementation option | Configurable comparison adapter |
| Identification interface | Multipart POST to `/v2/identify/all` | JSON POST to `/api/v3/identification` |
| Authentication | Private API key in query parameter | Private `Api-Key` header |
| Input | One to five JPEG or PNG photos of one individual | Base64 photo array in the implemented adapter |
| Model result | Ranked species, scores, optional GBIF ID and engine version | Ranked suggestions, probabilities and suggestion IDs |
| Advertised introductory allowance | 500 identifications per day on the free plan | 100 trial credits after registration |
| Advertised paid starting point | Pro starts at EUR 1,000 per year with 200,000 identifications | 1,000 credits at EUR 0.05 per request |
| Image handling evidence | Pricing FAQ says images remain in memory during identification and query history is retained | Full current retention and image-use terms still require confirmation before a real field-image trial |
| Local accuracy evidence | Not measured | Not measured |

Sources include the [Pl@ntNet introduction](https://my.plantnet.org/doc/getting-started/introduction), [identification contract](https://my.plantnet.org/doc/api/identify), [pricing and image-handling FAQ](https://my.plantnet.org/pricing), [Kindwise product page](https://www.kindwise.com/plant-id), [pricing](https://www.kindwise.com/pricing) and [API documentation](https://documenter.getpostman.com/view/24599534/2s93z5A4v2). The Kindwise terms endpoint returned a PDF in this environment and was not fully parsed. Provider marketing accuracy is not Plantiful evaluation evidence.

The adapter architecture supports both providers. Pl@ntNet is an initial engineering choice based on documented inputs and the prototype allowance, not a benchmark winner. Live response compatibility and suitability for Sarawak plants remain to be checked with real credentials and labelled observations. Provider scores are retained without treating them as calibrated correctness probabilities.

## Catalogue findings

A read-only anonymous query of the configured project's published catalogue returned zero visible rows on 4 November 2026 at 14:53 UTC. This does not prove that the private catalogue is empty. Officer access or an authorised catalogue export is needed to establish the actual target set.

The repository contains sample entries such as `Nepenthes lowii`, `Rafflesia tuan-mudae`, `Dipterocarpus grandiflorus`, `Calanthe triplicata` and `Begonia sarawakensis`. These are sample data, not a confirmed field dataset or evidence of provider coverage.

The read-only audit can be repeated from `web`.

```powershell
node --env-file=.env.local --import tsx scripts/field-assist-catalogue.ts
```

## Setup

### Database

Apply `backend/migrations/013_field_assist.sql` after the existing project schema. It creates the attempt, decision, guidance and alias tables, read policies, service-only mutation functions and private archive bucket. It does not replace existing observation approval or species-publication policies.

The new migration directory is explicitly included in `.gitignore`. Existing ignored backend configuration and secrets remain ignored. Only the intended migration and tests are added to the deliverable.

### Web backend

Configure these variables in the server's local environment or deployment settings.

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Existing project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Existing anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service credential |
| `AI_PROVIDER` | `plantnet` or `kindwise` |
| `PLANTNET_API_KEY` | Server-only key when using Pl@ntNet |
| `KINDWISE_API_KEY` | Server-only key when using Kindwise |
| `AI_PHOTO_BUCKET` | Optional, defaults to `record-photos` |

Leave `AI_PROVIDER` unset to disable new provider requests. Credentials are never returned to mobile or included in provider-error messages. Pl@ntNet places its key in the outbound URL, so infrastructure must not log full provider URLs.

Photographs are sent as file bytes. No separate location or notes fields are added to provider requests. Embedded image metadata may still be present. No provider reference images are downloaded or redistributed by this integration.

### Mobile

Set `EXPO_PUBLIC_FIELD_ASSIST_URL` to the web backend origin, without an API suffix. Use HTTPS for deployment. For a local phone trial, use the computer's reachable LAN address and web port, for example `http://192.168.1.19:3000`, not `localhost` on the phone. This is a backend address, not the Expo QR launch link.

Restart Expo after changing public environment variables. Mobile sends its Supabase access token to the configured backend. The backend verifies the user before any privileged query. Use only the trusted Plantiful backend origin.

### Reviewed guidance

An officer can expand Manage reviewed guidance and aliases on an AI record-review panel. Guidance requires a catalogue species, source and prompts. The backend stamps the reviewer identity and creates a revision. Alias records require a provider, source and reviewed scientific name, with a provider taxon ID when verified.

No species-specific guidance is prefilled as expert-reviewed. Generic capture checks are available without it. Name matching prioritises reviewed IDs, then reviewed aliases, then an unambiguous exact scientific name. Conflicting mappings remain unmapped.

## Retention and operating limits

Attempt and decision history is retained until its parent record is deleted. Archived photo objects are not automatically removed by a database cascade. An operator must reconcile unreferenced archive paths against `ai_identification_attempts.photos` before deleting orphaned objects. Do not delete referenced evidence while retaining its history.

The initial UI reads up to 20 attempts, 100 decisions and 1,000 catalogue species. These are explicit prototype limits, not proof of large-scale suitability. Benchmark requests bypass application admission limits and must fit the provider account budget.

## Verification commands

From `web`, run typecheck, lint, tests and production build.

```powershell
npx tsc --noEmit
npm run lint
npm test
npm run build
```

From `mobile`, run typecheck, lint, tests and Android export.

```powershell
npx tsc --noEmit
npm run lint
npm test
npx expo export --platform android
```

The isolated database test uses PGlite. Install `@electric-sql/pglite` in a temporary folder and set `PGLITE_MODULE` to its `dist/index.js`, then run from the repository root.

```powershell
node backend/tests/local/field-assist.mjs
```

This checks the migration and policies against a local schema fixture. It does not certify the deployed Supabase configuration. Use the [evaluation protocol](../Testing/Additional_Innovation/README.md) for live provider and participant work.

## Remaining external evidence

- Apply and verify the migration in the intended deployment.
- Configure a provider account and server credentials.
- Confirm the actual target catalogue and obtain independently labelled photographs.
- Run a live smoke test and the provider comparison.
- Verify the complete workflow on a physical phone and retain screenshots.
- Conduct participant comparisons and measure review quality and timing.

These items remain open on GitHub. No live accuracy, participant benefit or scalability result is claimed by the implementation alone.
