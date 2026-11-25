# Submission TODO and Evidence Checklist

**Project:** Plantiful, Group 7  
**Owner:** Basill Agas Anak Heatley Rogers, 102778888  
**Draft prepared:** 25 November 2026  
**Final submission date:** **[ACTION REQUIRED: insert official date]**

> **Purpose:** This is the master checklist for the Learning Summary Report, final group report, contribution form, evidence pack and release verification. Complete every item or record an explicit deferral. Do not include live secrets, real personal data or unredacted phone numbers in the repository or shared Drive.

---

## 1. Current Position

| Item | Status | Notes |
|---|---|---|
| Learning Summary Report draft | Draft created at `Docs/Reports/Learning_Summary_Report.md` | Needs personal review, word count and access dates |
| Final report master draft | Draft created at `Docs/Reports/Final_Report.md` | Needs Word export, figures, links and final verification |
| Contribution form draft | Draft created at `Docs/Reports/Final/Team_Contribution_Form.md` | Needs team confirmation, member numbers and signatures |
| Staff allowlist implementation | Repository work complete | Live migration and trigger verification pending |
| Password reset flow | Repository work complete | Live email delivery check pending |
| Web tests | 56 collected, 46 passed, 10 gated live checks skipped in the default offline run | Re-run and record the final result |
| Mobile tests | 30 passed | Re-run and record the final result |
| IoT tests | 36 passed | Re-run and record the final result |
| Web build | Latest local build passed and included `/admin/staff` | Re-run and record the final route count |
| Security assessment | 12 findings, 11 fixed, 1 mitigation recorded | Final ZAP and RLS retest outstanding |
| Credential exposure | Unresolved | Rotation and revocation record required |
| Independent usability study | Not completed | Run sessions or report the gap honestly |
| Official cover sheet and signed contribution form | Not inserted | Required before export |

---

## 2. Learning Summary Report

- [ ] Open `Docs/Reports/Learning_Summary_Report.md` and read it as a personal report, not a team report.
- [ ] Add the final word count. **[ACTION REQUIRED: Basill]**
- [ ] Add the official submission date. **[ACTION REQUIRED: Basill]**
- [ ] Replace every action marker.
- [ ] Add access dates for every online source in the bibliography.
- [ ] Confirm the bibliography matches the in-text references.
- [ ] Add one or two personal examples that only Basill can provide, such as a specific debugging incident, a sprint review lesson or a team coordination decision. **[ACTION REQUIRED: Basill]**
- [ ] Check that the report does not claim results that the project did not measure.
- [ ] Check that the report does not include secrets, real personal data or private team messages.
- [ ] Check the final style against `Docs/Archive/Basilagas21/Writing_Style_Prompt.md`.
- [ ] Remove the `Before submission` note.
- [ ] Export to PDF using the official cover sheet.
- [ ] Check the final page count and file size.

---

## 3. Final Report

- [ ] Open `Docs/Reports/Final_Report.md` and confirm the heading order matches the required final report structure.
- [ ] Replace the cover page section with the official unit cover sheet. **[ACTION REQUIRED: Basill]**
- [ ] Insert the tutor name and official submission date. **[ACTION REQUIRED: Basill]**
- [ ] Generate the automatic table of contents in Word.
- [ ] Generate the automatic list of figures and list of tables.
- [ ] Check that every section has a clear purpose and does not repeat the sprint reports without adding final-state value.
- [ ] Reconcile stale technology versions across the report, repository and presentation.
- [ ] Reconcile all `[TBD]` entries from the Sprint 2 report.
- [ ] Reconcile the web test count. State that 56 tests were collected, 46 passed and 10 gated live checks were skipped in the default offline run, if that is still the final result.
- [ ] Reconcile the mobile and IoT test counts with the latest run.
- [ ] Reconcile the web build route count with the latest build output.
- [ ] Reconcile the security findings. Do not claim that all findings are closed.
- [ ] Reconcile the open recommendations R-01 to R-10.
- [ ] Confirm that the report distinguishes implemented, locally verified, live verified and field verified work.
- [ ] Confirm that the report does not call the system production-ready, fully penetration tested or fully compliant.
- [ ] Add the final GitHub repository link. **[ACTION REQUIRED: Basill]**
- [ ] Add the Google Drive evidence link. **[ACTION REQUIRED: Basill]**
- [ ] Add the GitHub Projects board link. **[ACTION REQUIRED: Basill]**
- [ ] Add the final video link. **[ACTION REQUIRED: Basill]**
- [ ] Insert the signed contribution form in Appendix E or attach it as required.
- [ ] Remove every `[ACTION REQUIRED]`, `[INSERT IMAGE]`, `[INSERT LINK]`, `[TEAM CONFIRM]` and `[VERIFY BEFORE EXPORT]` marker before export.
- [ ] Check that the final PDF opens correctly and that figures are not blurry.
- [ ] Check the final file size against the unit limit.

---

## 4. Contribution Form

- [ ] Confirm the official member list. The repository records five named contributors and the team has referred to six members. **[TEAM CONFIRM]**
- [ ] Confirm Basill is member 6 on the official form.
- [ ] Confirm the member numbers for the other contributors.
- [ ] Confirm every contribution entry with the named member.
- [ ] Rebalance the percentages if a sixth member is added.
- [ ] Confirm the final percentages total 100 percent.
- [ ] Replace the Markdown draft with the official form.
- [ ] Collect signatures and dates from every member.
- [ ] Insert the signed form into the final report or submit it through the required channel.
- [ ] Do not commit signed forms with personal signatures to the public repository.

---

## 5. Evidence Collection

### 5.1 Official documents

- [ ] Official cover sheet.
- [ ] Official contribution form template.
- [ ] Signed contribution form.
- [ ] Unit submission instructions or marking rubric confirmation.
- [ ] Tutor name and official submission date.
- [ ] Final PDF naming convention.

### 5.2 Links

- [ ] Final GitHub repository link.
- [ ] Google Drive evidence folder link.
- [ ] GitHub Projects board link.
- [ ] Final demonstration video link.
- [ ] Deployment or test environment link, if shareable.
- [ ] Any client or partner approval evidence that is safe to share.

### 5.3 Project management evidence

- [ ] GitHub Projects board screenshot.
- [ ] GitHub Projects burn up chart screenshot from Insights.
- [ ] Sample burndown image. **[ACTION REQUIRED: Basill, insert the sample image the team will provide]**
- [ ] Reconstructed burndown chart, labelled as reconstructed.
- [ ] Kanban snapshots from Sprint 1 and Sprint 2.
- [ ] Sprint backlog or completed task screenshot.
- [ ] Contribution evidence from git history and pull requests.
- [ ] Reconstructed decision log with dates, decisions and owners.
- [ ] WhatsApp screenshots or exported chat with phone numbers redacted.
- [ ] Meeting notes or calendar evidence, if available.

### 5.4 UI and device screenshots

- [ ] Mobile capture screen with camera, torch and scanner guide.
- [ ] Mobile offline save or sync queue screen.
- [ ] Mobile sync status breakdown.
- [ ] Mobile sync conflict or failure state.
- [ ] GPS permission denial and recovery screen.
- [ ] QR scan flow.
- [ ] Officer review list.
- [ ] Officer review detail with observation photo.
- [ ] Officer rejection with reason.
- [ ] Officer conflict banner, using `Docs/Testing/Evidence/issue-39/01_officer_conflict_banner.png` if current.
- [ ] Public visitor species list.
- [ ] Public visitor species detail.
- [ ] Admin staff allowlist screen.
- [ ] Admin user management screen.
- [ ] Species create or edit screen.
- [ ] Reporting dashboard.
- [ ] Map view.
- [ ] Before and after device screens for the gesture-area fix.
- [ ] IoT dashboard or sensor history.
- [ ] IoT alert state.
- [ ] Physical IoT assembly, using `Docs/Testing/Evidence/sprint2-iot/01-actual-assembly.jpeg` if current.
- [ ] Final demonstration screenshots for the slides or appendix.

### 5.5 Test and build evidence

- [ ] Final web lint output.
- [ ] Final web type check output.
- [ ] Final web test output with the exact count and skipped tests.
- [ ] Final mobile test output.
- [ ] Final IoT test output.
- [ ] Final web production build output with route count.
- [ ] Expo Doctor output.
- [ ] Final dependency audit output for web.
- [ ] Final dependency audit output for mobile.
- [ ] Final RLS and storage policy check output.
- [ ] Final anonymous mutation probe output.
- [ ] Final ZAP report or summary.
- [ ] Security header capture.
- [ ] Secret handling check.
- [ ] Credential rotation record without secret values.
- [ ] Usability session notes and results, if completed.
- [ ] Device trial notes and screenshots.

---

## 6. Technical Release Checks

### 6.1 Database and access control

- [ ] Confirm the live Supabase project and migration order.
- [ ] Apply `backend/supabase/migrations/015_staff_allowlist.sql` to the live project. **[ACTION REQUIRED: Basill]**
- [ ] Verify the email normalisation trigger with mixed-case and whitespace test inputs.
- [ ] Verify that an allowlisted email receives the approved role on signup.
- [ ] Verify that a non-allowlisted email is blocked from receiving a managed role.
- [ ] Verify that an existing account role changes when the allowlist role changes.
- [ ] Verify that only admins can read or write the staff allowlist.
- [ ] Verify that a user cannot remove or change their own entry in a way that breaks access.
- [ ] Confirm `014_public_record_visibility.sql` is applied and matches the intended policy.
- [ ] Re-run the live RLS and storage policy checks.
- [ ] Record the result with date, commit and environment.

### 6.2 Credentials and secrets

- [ ] Identify every environment that used the exposed service-role key.
- [ ] Revoke the exposed key.
- [ ] Create a replacement key.
- [ ] Update the trusted server and IoT bridge environments.
- [ ] Confirm the old key is denied.
- [ ] Confirm legitimate bridge and application operations still work.
- [ ] Confirm no live key appears in the repository, report, slides or Drive.
- [ ] Confirm `web/.env.local` and `mobile/.env` are not committed.
- [ ] Provide `.env.example` files with placeholders only.
- [ ] Record the rotation date and responsible owner without secret values.

### 6.3 AI Field Assist

- [ ] Add `GROQ_API_KEY` to the web environment. **[ACTION REQUIRED: Basill]**
- [ ] Fix the stale Field Assist URL in `mobile/.env`. **[ACTION REQUIRED: Basill]**
- [ ] Confirm the mobile device can reach the web server on the local network.
- [ ] Test a successful Field Assist request.
- [ ] Test a missing-key or quota failure.
- [ ] Test that the response is presented as a draft for review, not an authority.
- [ ] Record the verification date and environment.

### 6.4 IoT and sensors

- [ ] Confirm the MQTT broker and topic settings.
- [ ] Confirm the bridge can write sensor readings to Supabase.
- [ ] Calibrate the soil moisture sensor and record the method.
- [ ] Test temperature, humidity, rain and motion readings.
- [ ] Test an alert threshold.
- [ ] Test a disconnected sensor or broker failure.
- [ ] Confirm the bridge host is trusted and the service key is not exposed.
- [ ] Record the physical build and readings with dated screenshots.

### 6.5 Mobile release

- [ ] Confirm the supported Android device list.
- [ ] Test capture, GPS denial, QR scan, offline save and sync.
- [ ] Test a conflict or failed sync state.
- [ ] Test sign-out and sign-in.
- [ ] Test the latest staff allowlist behaviour with an approved and unapproved account.
- [ ] Decide whether a signed Android release is required.
- [ ] If required, build and archive the release.
- [ ] If deferred, record the deferral and its impact.

### 6.6 Web release

- [ ] Confirm the hosted environment variables.
- [ ] Confirm admin, officer, botanist and visitor access.
- [ ] Confirm the staff allowlist page is reachable only to admins.
- [ ] Confirm the public visitor view excludes unapproved records.
- [ ] Confirm password reset delivery and callback behaviour.
- [ ] Confirm security headers on the hosted build.
- [ ] Re-run the final ZAP procedure against the final deployment.
- [ ] Confirm the latest build route count and record it.

---

## 7. Repository and Documentation

- [ ] Confirm the `README.md` migration order matches the actual files.
- [ ] Confirm the `seed.sql` accounts and roles match the report.
- [ ] Confirm the staff allowlist seed entries are documented.
- [ ] Confirm `backend/*` is ignored by `.gitignore` line 71 and decide whether that is acceptable for submission.
- [ ] If backend files must be tracked, add the required migration and seed files without secrets.
- [ ] Confirm no temporary build workaround remains in `next.config` or similar files.
- [ ] Confirm the final branch is clean or that only intended files are changed.
- [ ] Confirm the final commit hash used for test and build evidence.
- [ ] Confirm all links in the report resolve.
- [ ] Confirm all figure paths exist.
- [ ] Confirm all tables render correctly after Word export.
- [ ] Confirm the final report does not link to local-only files that the marker cannot access.
- [ ] Confirm the Google Drive contains a clear folder structure and a short index.

Suggested Drive structure:

```text
Plantiful_Submission/
  01_Final_Report/
  02_Learning_Summary_Report/
  03_Contribution_Forms/
  04_Evidence/
    Project_Management/
    UI_Screenshots/
    Testing/
    Security/
    IoT/
  05_Presentation_and_Video/
  06_Source_Code_Link/
```

---

## 8. Writing and Consistency Checks

- [ ] Remove em dashes.
- [ ] Remove sentence semicolons.
- [ ] Remove colon-led sentence constructions where they feel mechanical.
- [ ] Remove repeated bold-lead bullet patterns.
- [ ] Remove inflated claims such as "fully tested", "seamless", "production-ready" or "fully secure".
- [ ] Use "partially verified" or "implemented but not live verified" where appropriate.
- [ ] Check that every result has a date, environment and evidence boundary.
- [ ] Check that every recommendation has an owner and status.
- [ ] Check that every placeholder is either filled or deliberately removed.
- [ ] Check that the Learning Summary Report uses first person and the final report uses team voice.
- [ ] Check that the final report uses consistent names, student IDs, dates and product terms.
- [ ] Check that "Plantiful" is spelled consistently.
- [ ] Check that "Sarawak Forestry Corporation" and "NeuonAI" are spelled consistently.
- [ ] Check that the report does not include live account passwords.
- [ ] Check that the report does not include phone numbers or personal contact details.
- [ ] Check that the report does not include the exposed service-role key.

---

## 9. Final Export and Submission

- [ ] Convert the final report from Markdown to Word.
- [ ] Apply the official cover sheet.
- [ ] Insert the signed contribution form.
- [ ] Insert all figures at readable resolution.
- [ ] Generate the table of contents, list of figures and list of tables.
- [ ] Check page breaks and heading styles.
- [ ] Check that tables do not split awkwardly across pages.
- [ ] Export to PDF.
- [ ] Open the PDF on a second device and check fonts, images and links.
- [ ] Check the final file size.
- [ ] Name the file according to the unit convention.
- [ ] Upload the final PDF to the required submission channel.
- [ ] Upload the evidence pack to the shared Drive if required.
- [ ] Confirm the video link is accessible to the marker.
- [ ] Confirm the GitHub repository is accessible to the marker.
- [ ] Confirm the contribution form is submitted through the required channel.
- [ ] Keep a local copy of the final PDF and evidence pack.
- [ ] Record the submission timestamp and receipt.

---

## 10. Final Gate

Do not submit until these statements are true.

- [ ] The report does not claim that the final live database state is verified unless it has been verified.
- [ ] The report does not claim that the exposed credential is resolved unless it has been revoked and the old key is denied.
- [ ] The report does not claim independent usability results unless sessions were completed.
- [ ] The report does not claim a signed mobile release unless one exists.
- [ ] The report does not claim a final ZAP pass unless the final re-scan was run.
- [ ] The report does not include live secrets or real personal data.
- [ ] The contribution form is signed and totals 100 percent.
- [ ] The official cover sheet is inserted.
- [ ] The final PDF opens correctly.
- [ ] The submission receipt is saved.

---

## 11. Deferral Record

Use this table if any item cannot be completed before submission. A deferral is better than an unsupported claim.

| Item | Reason for deferral | Impact on claims | Owner | Recorded in report |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
