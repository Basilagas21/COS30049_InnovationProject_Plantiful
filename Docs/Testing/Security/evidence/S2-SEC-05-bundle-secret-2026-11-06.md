# Client bundle and secret handling check

Date: 6 November 2026

Revision: working tree at parent commit `57062e7`

Scope: tracked source and tracked file names. No current production bundle was available because the web build did not complete on this host.

## Checks

| Check | Command | Result |
|---|---|---|
| Tracked service-role references | `git grep -n -E "sb_secret_\|service_role\|SUPABASE_SERVICE_ROLE_KEY"` | No `sb_secret_` value found. References exist only in server or trusted-host code and one test fixture |
| Tracked environment files | `git ls-files` filtered for `.env` names | No environment file is tracked |
| Mobile client key | Source review of `mobile/src/lib/supabase.ts` | Uses `EXPO_PUBLIC_SUPABASE_ANON_KEY` only |
| Web browser client key | Source review of `web/src/lib/supabase/client.ts` | Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` only |
| Web server client | Source review of `web/src/lib/supabase/server.ts` | Uses the anon key with the user session cookie. It does not embed the service role in the browser client |

## Service-role references found

| File | Context |
|---|---|
| `iot/supabase_rest.py` | Trusted host bridge reads `SUPABASE_SERVICE_ROLE_KEY` from its environment |
| `web/src/lib/field-assist-server.ts` | Server-only AI route reads `SUPABASE_SERVICE_ROLE_KEY` |
| `web/src/app/api/field-assist.test.mjs` | Test fixture value `fixture-service` |

The bridge and server route are privileged components. Their use of the service role does not make the key a client credential. The key must remain server-side and must not be placed in an `EXPO_PUBLIC_` or `NEXT_PUBLIC_` variable.

## Interpretation

The source review supports the claim that the browser and mobile clients ship only the publishable key. It does not replace a full built-bundle inspection or native binary inspection. Repeat the check on the final exported web bundle and Android build.

No secret values are included in this summary.
