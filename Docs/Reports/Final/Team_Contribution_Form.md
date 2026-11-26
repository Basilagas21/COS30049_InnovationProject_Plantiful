# Team Contribution Form

**Unit:** COS30049 Computing Technology Innovation Project  
**Project:** Plantiful, Biodiversity Record Management and Field Monitoring System  
**Team:** Group 7  
**Prepared by:** Basill Agas Anak Heatley Rogers, 102778888  
**Date:** 25 November 2026

***

## 1. Purpose and Evidence Basis

This form records the contribution of each member to the Plantiful project. It is based on the recorded development history, sprint records, review activity and final documentation. The contribution shares reflect the agreed distribution of work across the project.

Basill's contribution began on 6 September 2026, before formal issue tracking started. The early work is evidenced by the recorded development history.

The official team list is Nathan Sebastian Learmonth 102782258, Badrul Aliff Aiman bin Badrulmunirzaki 102778273, Muhammad Maqeel bin Muhammad Kahfi 102782384, Ashley Wallen Anak Winston 105806559, Basill Agas Anak Heatley Rogers 102778888 and Gae Jayden MWINE 104393610.

***

## 2. Contribution Shares

Basill Agas Anak Heatley Rogers, 102778888, share 24 percent.

Nathan Sebastian Learmonth, 102782258, share 18 percent.

Badrul Aliff Aiman bin Badrulmunirzaki, 102778273, share 15 percent.

Muhammad Maqeel bin Muhammad Kahfi, 102782384, share 18 percent.

Ashley Wallen Anak Winston, 105806559, share 10 percent.

Gae Jayden MWINE, 104393610, share 15 percent.

The contribution shares total 100 percent.

***

## 3. Individual Contribution Records

### 3.1 Basill Agas Anak Heatley Rogers

**Student ID:** 102778888  
**Member number:** 6

Leadership and coordination

1. Led sprint planning, task allocation and progress tracking from the early development period beginning on 6 September 2026.
2. Coordinated work across the React Native mobile app, Next.js web app, Supabase data service and IoT stream so the team delivered one connected system rather than separate demonstrations.
3. Reviewed completed work and checked that written claims matched the implemented system and the available evidence.
4. Maintained the delivery board and kept the team focused on the required features, testing evidence and final submission material.
5. Shaped the final report structure, submission checklist and evidence boundaries so that delivered work, tested work and outstanding work were clearly separated.

Mobile field capture and digital ground truthing

1. Built the React Native field capture flow that lets a botanist record a plant using a photograph, GPS location, morphological notes and a QR tag.
2. Added device based storage using SQLite so field records can be saved when the network is unavailable and synchronised when connectivity returns.
3. Designed the record state messages so a user can tell whether an observation is waiting, synced, in conflict or failed instead of assuming that a local save reached the database.
4. Implemented camera, GPS and QR scanning behaviour for field use, including QR tag generation for new plant records.
5. Added recovery steps for denied location access and other field permission problems.
6. Refined phone layout, bottom clearance, scanner guidance and navigation so the app is usable during field work.
7. Connected mobile records to the shared database through role based access and common record states used by the web approval workflow.

IoT monitoring and plant protection

1. Built the simulated sensor feed that registers monitoring points and produces repeatable temperature, humidity, movement, soil moisture and rain readings.
2. Built the threat evaluation rules for heat, low humidity, movement and silent sensors.
3. Added alert cooldown and escalation behaviour so repeated conditions do not flood the officer dashboard while worsening conditions still raise a new alert.
4. Built the bridge that forwards real sensor readings from the ESP32 hardware node to the shared database.
5. Added outage handling so buffered readings are retried when the connection returns and data loss is reported clearly when it occurs.
6. Built the monitoring dashboard and the separate alert notification page with alert cards for severity, sensor, time and review state.
7. Added the header alert indicator so officers can see open alerts without opening the full dashboard.
8. Added local environment loading for the IoT scripts and verified the simulator, evaluator and IoT contract tests from a clean terminal.

Account control, database work and web product refinement

1. Added the staff allowlist so administrators can control which staff email addresses receive officer or admin access, while unlisted accounts remain botanists.
2. Replaced the older signup role handling so the database assigns managed staff roles from the allowlist and updates existing accounts when an entry changes.
3. Added clear guidance for the allowlist database update and confirmed that the migration was applied successfully in the live database.
4. Confirmed the public record visibility update and verified that anonymous reads return only approved observations linked to published species.
5. Added password recovery so a user can request a reset link and choose a new password through a verified callback.
6. Reorganised the web navigation into grouped menus so the volume of modules is easier to manage.
7. Added pagination and a four column layout to the inquiries page so public messages are easier to review.
8. Reworked the reports page into a reporting workspace with coverage counts, clear report choices and a searchable report library.
9. Improved the map so wheel zoom stays inside the map and uses a clearer street map with 3D terrain.
10. Converted the visitor questions section into individual dropdowns and added an oldest option to the user sort control.

Integration, testing and verification

1. Connected the mobile app, web app and shared database through common roles, record states and publication rules.
2. Updated setup guidance so database migrations, seed data and verification steps are clear and repeatable.
3. Organised backend documentation so current migrations, historical migrations and checks are clearly separated.
4. Ran lint checks, type checks, automated tests and production builds for the web app.
5. Ran lint checks, type checks and automated tests for the mobile app.
6. Ran the IoT contract tests and a live simulator pass to verify the sensor feed and alert evaluation.
7. Verified the live staff allowlist table and public visibility rules after the migrations succeeded.
8. Recorded remaining release items honestly so the submission does not imply that unmeasured or unretained evidence exists.

Contribution alignment with project scope

1. Smart Digital Ground Truthing Platform: the React Native capture flow, QR tagging, GPS recording, offline SQLite storage, synchronisation states and conflict handling directly support the required mobile field documentation workflow.
2. Digital Plant Knowledge System: the web refinements to reports, maps, navigation, inquiries and visitor questions support retrieval, reporting and public access to verified biodiversity information.
3. Cybersecurity and Data Protection: the staff allowlist, password recovery, role control and public visibility verification support secure access and protection of unpublished records.
4. IoT Enabled Plant Protection: the sensor simulator, evaluator, hardware bridge, cooldown rules, monitoring dashboard and alert cards support real time sensing, threat detection and centralised monitoring.
5. Additional Innovation: the connected workflow and clear record states improve field data collection by making offline capture, review outcomes and environmental context visible in one system.

Release limitations

1. Credential rotation remains an owner decision and is not claimed as completed.
2. The final external security recheck, signed Android release, soil moisture calibration, five user walkthrough and full artificial intelligence field verification were not completed.
3. The staff allowlist and public visibility migrations were applied successfully in the live database.

### 3.2 Nathan Sebastian Learmonth

**Student ID:** 102782258

1. Built the web catalogue that stores and presents plant species knowledge.
2. Supported search, record viewing and officer review workflows.
3. Contributed to documentation and sprint reporting.
4. Reviewed web behaviour and supported integration checks.

### 3.3 Gae Jayden MWINE

**Student ID:** 104393610

1. Led the security assessment after the role exchange with Basill.
2. Reviewed access control behaviour across public, botanist, officer and admin views.
3. Tracked remediation evidence and final release readiness.
4. Recorded remaining security limitations for the final report.

### 3.4 Muhammad Maqeel bin Muhammad Kahfi

**Student ID:** 102782384

1. Designed and maintained the shared data structure used by the mobile and web apps.
2. Built the backend data access used by field sync and record workflows.
3. Supported database access rules and storage behaviour.
4. Supported integration between clients and the shared data service.

### 3.5 Badrul Aliff Aiman bin Badrulmunirzaki

**Student ID:** 102778273

1. Contributed to reporting and map views.
2. Supported public access verification and partner facing evidence.
3. Reviewed map and report behaviour for officer use.
4. Supported final evidence collection.

### 3.6 Ashley Wallen Anak Winston

**Student ID:** 105806559

1. Contributed to integration, project management and documentation.
2. Supported coordination of delivery evidence and final submission material.

***

## 4. Shared Team Contributions

The following work was shared across the team.

1. Requirements discussion and scope decisions with the client and tutor.
2. Sprint review, retrospective and backlog refinement.
3. Review of major design and usability choices.
4. Security remediation discussion and release risk review.
5. Final report writing, figure selection and submission checks.

***

## 5. Declaration

We confirm that the contribution information in this form is accurate to the best of our knowledge. We understand that each share reflects the agreed contribution to the project and that the signed form is the final record.

[ ] Basill Agas Anak Heatley Rogers agrees with this record.

[ ] Nathan Sebastian Learmonth agrees with this record.

[ ] Gae Jayden MWINE agrees with this record.

[ ] Muhammad Maqeel bin Muhammad Kahfi agrees with this record.

[ ] Badrul Aliff Aiman bin Badrulmunirzaki agrees with this record.

[ ] Ashley Wallen Anak Winston agrees with this record.

[ ] The team agrees that the contribution shares total 100 percent.

Signature and date for Basill Agas Anak Heatley Rogers: ____________________

Signature and date for Nathan Sebastian Learmonth: ____________________

Signature and date for Gae Jayden MWINE: ____________________

Signature and date for Muhammad Maqeel bin Muhammad Kahfi: ____________________

Signature and date for Badrul Aliff Aiman bin Badrulmunirzaki: ____________________

Signature and date for Ashley Wallen Anak Winston: ____________________

***

## 6. Submission Notes

The signed form is included in the final report package.

Names, student IDs and contribution shares match the official team record.
