# Additional Innovation handover

## Resume here

The owner approved implementation of AI Field Assist and GitHub issues #76 through #84. Code, setup guidance, a benchmark runner and development tests were implemented. No commit or push was authorised by the assistant's task.

The owner now reports that the new database tables are visible after applying the migration. Treat this as owner-reported deployment progress. Deployed access policies, storage and end-to-end provider operation have not yet been verified.

## Latest local configuration

- Existing web and mobile Supabase URL and anon-key settings were detected and preserved. Their values were not displayed.
- `web/.env.local` now contains `AI_PROVIDER=plantnet` and `AI_PHOTO_BUCKET=record-photos`.
- Blank `PLANTNET_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` entries were added at the top of that local file. The owner must paste the real values locally.
- `mobile/.env` now points `EXPO_PUBLIC_FIELD_ASSIST_URL` to `http://192.168.1.9:3000`.
- The Wi-Fi address was verified during this setup session. Recheck it if the network changes.
- Both environment files are ignored and were not tracked when checked. Never copy real keys into this document, chat, screenshots or GitHub.
- Web port 3000 and Expo port 8081 were listening when checked. Restart the web server and Expo after completing environment configuration.

## Implemented mobile scope

Records and Species use two-column cards. Bottom navigation has Records, Scan and Species. Profile is in the top-right header. Sync is accessible from Records through a status/action.

Capture, discovery, edit and record details include evidence-completeness checks. Optional organ declarations persist in Notes. Missing evidence does not block otherwise valid offline saves.

Record details include AI Field Assist with upload requirements, provider suggestions, provisional selection, an unidentified decision, reviewed guidance and cached history. The owner requests identification after syncing the record and photographs.

## Implemented web scope

The web app hosts the authenticated provider API and the officer review workflow. Approvals links to AI review in record details. Officers can inspect archived analysed photos, suggestions, evidence freshness and collector decisions. They can record identification decisions, corrections and evidence requests. Reviewed guidance and provider aliases have an officer editor.

The current web interface does not offer a general photo-identification upload tool or a web Suggest species button. The identification request action is in mobile. Identification decisions do not automatically overwrite observation species or approve or publish a record.

## Verification already recorded

Web typecheck, production build and 42 tests passed. Web lint had zero errors and three existing warnings. Mobile typecheck, lint, 21 tests and Android export passed. Ten isolated database checks passed. See the verification record for the exact development scope and failures/retests.

No live provider accuracy, participant improvement or scalability result has been recorded. An anonymous published-catalogue query returned no visible rows. This does not establish that the private catalogue is empty.

## Next steps

1. Owner fills the two blank server-only keys in `web/.env.local`.
2. Verify configuration presence without printing credentials.
3. Restart web and Expo in Expo Go mode and confirm phone access to the backend.
4. Confirm private `ai-evidence` storage and migration functions and policies in the deployed project.
5. Run one real botanist capture, sync, identification and officer-review trial.
6. Record actual screenshots, provider result and errors if any.
7. Obtain independently confirmed plant photographs and run the provider benchmark.
8. Conduct the participant comparison and update the sprint tracker and issues.

## Reference files

- [Sprint tracker](Additional_Innovation_Tracker.md)
- [Implementation and setup](../../Guides/AI_Field_Assist.md)
- [Evaluation protocol](../../Testing/Additional_Innovation/README.md)
- [Development verification](../../Testing/Additional_Innovation/Verification.md)
- Migration `backend/migrations/013_field_assist.sql`
- Main GitHub tracking issue #84
