# AI Field Assist verification record

## Scope

Checks were run on the uncommitted working tree on 4 November 2026. The starting revision was `2e9088f`. This record describes development verification, not a deployed release or a completed accuracy study.

| Check | Result | Boundary |
|---|---|---|
| Web TypeScript | Passed | Application, scripts and test types |
| Web lint | Zero errors, three existing warnings | Existing record image warning and two unused e2e variables |
| Web automated tests | 42 passed | Includes provider parsing, transport fixtures, API access, evidence staleness and evaluation arithmetic |
| Web production build | Passed | Both new API routes compiled |
| Mobile TypeScript | Passed | Includes the shared type-only API contract |
| Mobile lint | Passed | No errors reported |
| Mobile automated tests | 21 passed | Includes four evidence-checklist tests and existing sync/QR tests |
| Android Metro export | Passed | JavaScript and assets bundled, not a physical-phone trial |
| Isolated database checks | 10 passed | PGlite fixture with the core schema and Supabase auth/storage shim |
| Public catalogue query | Zero anonymously visible published rows | Does not establish that the private catalogue is empty |
| Live provider identification | Not run | Provider keys and confirmed observations not supplied |
| Live migration and storage policies | Not run | Deployment remains pending |
| Participant comparison | Not run | Results template remains empty |

## Database behaviours exercised

1. One processing reservation is created and duplicates reuse it.
2. Another owner and a stale record revision cannot reserve an attempt.
3. Another active request for the same user is denied.
4. Owners and officers can read history while unrelated users cannot.
5. Direct authenticated mutations and privileged function calls are denied.
6. Collector and officer decisions append without changing observation assignment.
7. Role spoofing, unrelated collectors and fingerprint mismatch are rejected.
8. A changed record revision blocks a decision while retaining history.
9. An interrupted attempt can be retried and its earlier failure is retained.
10. Completed identical evidence is reused.

These checks ran locally and did not modify a deployed database. Production storage policy compatibility and operational request limits still need the deployment trials in the protocol.

## Failures and retests

- The initial web typecheck could not resolve the already-declared Playwright dependency. `npm ci` first failed with Windows EPERM because the running Next.js server held a native CSS module. The identified web process was stopped and installation succeeded. The dependency audit reported zero findings for that installation scope.
- The new web component initially failed the effect-state lint rule. Initial history loading was changed to an abortable fetch subscription. Lint then passed with only the three existing warnings.
- Signed preview URL typing initially allowed null where the response type expected an optional string. The assignment now normalises null to undefined and typecheck passed.

## Reproduction

Use the commands in [AI Field Assist setup](../../Guides/AI_Field_Assist.md). The route tests use a local HTTP fixture and mocked provider responses. They do not contact a real identification provider or measure model correctness.

The Android export was written outside the repository under the approved temporary work directory. PGlite was installed in that temporary directory and loaded through `PGLITE_MODULE`. It was not added to production application dependencies.
