# Plantiful mobile

Expo/React Native field application for offline observation capture, photographs, GPS, a downloaded species catalogue and later synchronisation. This is the mobile category's single README.

## Setup

Run these commands from `mobile/`.

```powershell
npm install
npm start -- --clear --lan
```

The start script uses Expo Go. Scan its QR code in Expo Go. Keep the computer and phone on the same network for local development.

Configure the ignored `.env` file with the existing Supabase project settings.

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_KEY
EXPO_PUBLIC_FIELD_ASSIST_URL=http://YOUR_COMPUTER_WIFI_IP:3000
```

Restart Expo after changing these values. The Field Assist URL is the web backend address, not Expo's launch address. Do not put provider keys or Supabase service credentials in mobile configuration.

## Workflow

Capture and save observations locally, then use Sync when connected. Hosted AI suggestions require an uploaded record and photographs plus a reachable backend with internet access. Offline pretrained identification is under investigation and is not implemented.

See [AI research](../Ai/README.md) and the [Field Assist setup guide](../Docs/Guides/AI_Field_Assist.md).

## Commands

| Command | Purpose |
|---|---|
| `npm start -- --clear --lan` | Expo Go development server with cleared cache |
| `npm run start:dev` | Development-client server |
| `npx tsc --noEmit` | Typecheck |
| `npm run lint` | Lint |
| `npm test` | Existing helper and regression tests |

## Structure

- `src/app/` contains Expo Router screens and layouts.
- `src/components/` contains shared interface components.
- `src/lib/` contains application helpers and integrations.
- `src/db.ts` manages local persistence.
- `src/theme.ts` defines theme tokens.

Read `AGENTS.md` before changing Expo or React Native integrations.
