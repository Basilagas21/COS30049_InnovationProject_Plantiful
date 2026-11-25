# Team Contribution Form

**Unit:** COS30049 Computing Technology Innovation Project  
**Project:** Plantiful, Biodiversity Record Management and Field Monitoring System  
**Team:** Group 7  
**Prepared by:** Basill Agas Anak Heatley Rogers, 102778888  
**Draft date:** **[ACTION REQUIRED: Basill, insert date]**

> **Before submission:** Replace this draft with the official unit form. Complete every confirmation marker with the team, insert signatures and dates, and remove all draft notes. The percentage shares below are a proposed starting point agreed only after every member confirms their own entry.

***

## 1. How to read this form

**[TEAM CONFIRM]** means the named member must check the statement and remove the marker once they agree. It is not a final claim until that member confirms it. The marker protects the team from submitting inferred work as fact.

This form was prepared from the recorded development history, sprint records, review activity and final documentation. Those sources show what work was recorded. They do not measure effort or value by themselves. Each member must confirm their own contribution before the form is signed.

The official team list is Nathan Sebastian Learmonth 102782258, Badrul Aliff Aiman bin Badrulmunirzaki 102778273, Muhammad Maqeel bin Muhammad Kahfi 102782384, Ashley Wallen Anak Winston 105806559, Basill Agas Anak Heatley Rogers 102778888 and Gae Jayden MWINE 104393610.

Each member should write their own role on the official form. This draft leaves roles out so that the signed record uses the team's own wording.

The wording below avoids internal paths and technical shorthand so that an academic marker and an industry client can read each contribution clearly.

***

## 2. Proposed contribution shares

Basill Agas Anak Heatley Rogers, 102778888, proposed share 24 percent.

Nathan Sebastian Learmonth, 102782258, proposed share 18 percent.

Badrul Aliff Aiman bin Badrulmunirzaki, 102778273, proposed share 15 percent.

Muhammad Maqeel bin Muhammad Kahfi, 102782384, proposed share 18 percent.

Ashley Wallen Anak Winston, 105806559, proposed share 10 percent.

Gae Jayden MWINE, 104393610, proposed share 15 percent.

Total proposed share is 100 percent. Every share requires team confirmation. **[TEAM CONFIRM]**

***

## 3. Individual contribution records

### 3.1 Basill Agas Anak Heatley Rogers

**Student ID:** 102778888  
**Member number:** 6

**Leadership and coordination**

1. Led sprint planning, task allocation and progress tracking. **[TEAM CONFIRM]**
2. Coordinated work across the mobile app, web app, data service and IoT stream so the team worked toward one shared system. **[TEAM CONFIRM]**
3. Reviewed completed work and checked that written claims matched what the system actually did. **[TEAM CONFIRM]**
4. Maintained the delivery board and kept the team focused on the required features and evidence. **[TEAM CONFIRM]**
5. Helped shape the final report structure, the submission checklist and the evidence boundaries. **[TEAM CONFIRM]**

**Mobile field capture**

1. Built the field capture flow that lets a botanist record a plant using a photograph, location and QR tag. **[TEAM CONFIRM]**
2. Added the ability to save work on the device while offline and sync it when the network returns. **[TEAM CONFIRM]**
3. Added clear status messages so a user can tell whether a record is waiting, synced, in conflict or failed. **[TEAM CONFIRM]**
4. Added camera, GPS and QR scanning behaviour for field use. **[TEAM CONFIRM]**
5. Added recovery steps for denied location access and other field permission problems. **[TEAM CONFIRM]**
6. Refined device layout, bottom clearance and navigation so the app is usable on a phone during field work. **[TEAM CONFIRM]**

**IoT monitoring and alerting**

1. Built the simulated sensor feed that registers monitoring points and produces repeatable field readings. **[TEAM CONFIRM]**
2. Built the threat evaluation rules for heat, low humidity, movement and silent sensors. **[TEAM CONFIRM]**
3. Added alert cooldown and escalation behaviour so repeated conditions do not flood the dashboard. **[TEAM CONFIRM]**
4. Built the bridge that forwards real sensor readings from the hardware node to the shared data store. **[TEAM CONFIRM]**
5. Added outage handling so buffered readings can be retried when the connection returns. **[TEAM CONFIRM]**
6. Built the monitoring dashboard and the separate alert notification page with alert cards. **[TEAM CONFIRM]**
7. Added the header alert indicator so officers can see open alerts without opening the dashboard. **[TEAM CONFIRM]**
8. Added local environment loading for the IoT tools and verified the simulator and test suite from a clean terminal. **[TEAM CONFIRM]**

**Account control and web product refinement**

1. Added the staff allowlist so administrators can control which staff email addresses receive officer or admin access. **[TEAM CONFIRM]**
2. Added clear guidance when the allowlist database update has not been applied. **[TEAM CONFIRM]**
3. Added password recovery so a user can request a reset link and choose a new password. **[TEAM CONFIRM]**
4. Reworked the navigation into grouped menus so the system is easier to scan and use. **[TEAM CONFIRM]**
5. Added pagination and a four column layout to the inquiries page so public messages are easier to review. **[TEAM CONFIRM]**
6. Reworked the reports page into a reporting workspace with coverage counts, clear report choices and a searchable report library. **[TEAM CONFIRM]**
7. Improved the map so wheel zoom stays inside the map and uses a clearer street map with 3D terrain. **[TEAM CONFIRM]**
8. Improved the visitor questions section so each answer opens in its own dropdown. **[TEAM CONFIRM]**
9. Added an oldest option to the user sort control. **[TEAM CONFIRM]**

**Integration and verification**

1. Connected the mobile app, web app and shared data service through common roles and record states. **[TEAM CONFIRM]**
2. Updated setup guidance so migrations, seed data and verification steps are easier to follow. **[TEAM CONFIRM]**
3. Organised backend documentation so current migrations, historical migrations and checks are clearly separated. **[TEAM CONFIRM]**
4. Ran lint, type checks, tests and production builds for the web app. **[TEAM CONFIRM]**
5. Ran lint, type checks and tests for the mobile app. **[TEAM CONFIRM]**
6. Ran the IoT contract tests and a live simulator pass to verify the sensor feed and alert evaluation. **[TEAM CONFIRM]**
7. Recorded outstanding release items honestly, including the unapplied staff allowlist database update and final external checks. **[TEAM CONFIRM]**

**Limitations**

1. The live staff allowlist database update was not applied before this draft. **[TEAM CONFIRM]**
2. The final external security recheck and signed Android release were not completed. **[TEAM CONFIRM]**

### 3.2 Nathan Sebastian Learmonth

**Student ID:** 102782258

1. Built the web catalogue that stores and presents plant species knowledge. **[TEAM CONFIRM]**
2. Supported search, record viewing and officer review workflows. **[TEAM CONFIRM]**
3. Contributed to documentation and sprint reporting. **[TEAM CONFIRM]**
4. Reviewed web behaviour and supported integration checks. **[TEAM CONFIRM]**

### 3.3 Gae Jayden MWINE

**Student ID:** 104393610

1. Led the security assessment after the role exchange with Basill. **[TEAM CONFIRM]**
2. Reviewed access control behaviour across public, botanist, officer and admin views. **[TEAM CONFIRM]**
3. Tracked remediation evidence and final release readiness. **[TEAM CONFIRM]**
4. Recorded remaining security limitations for the final report. **[TEAM CONFIRM]**

### 3.4 Muhammad Maqeel bin Muhammad Kahfi

**Student ID:** 102782384

1. Designed and maintained the shared data structure used by the mobile and web apps. **[TEAM CONFIRM]**
2. Built the backend data access used by field sync and record workflows. **[TEAM CONFIRM]**
3. Supported database access rules and storage behaviour. **[TEAM CONFIRM]**
4. Supported integration between clients and the shared data service. **[TEAM CONFIRM]**

### 3.5 Badrul Aliff Aiman bin Badrulmunirzaki

**Student ID:** 102778273

1. Contributed to reporting and map views. **[TEAM CONFIRM]**
2. Supported public access verification and partner facing evidence. **[TEAM CONFIRM]**
3. Reviewed map and report behaviour for officer use. **[TEAM CONFIRM]**
4. Supported final evidence collection. **[TEAM CONFIRM]**

### 3.6 Ashley Wallen Anak Winston

**Student ID:** 105806559

1. Contributed to integration, project management and documentation. **[TEAM CONFIRM]**
2. Confirm the exact wording of this entry with Ashley before the form is signed. **[TEAM CONFIRM]**

***

## 4. Shared team contributions

The following work was shared and should not be claimed by one member alone.

1. Requirements discussion and scope decisions with the client and tutor. **[TEAM CONFIRM]**
2. Sprint review, retrospective and backlog refinement. **[TEAM CONFIRM]**
3. Review of major design and usability choices. **[TEAM CONFIRM]**
4. Security remediation discussion and release risk review. **[TEAM CONFIRM]**
5. Final report writing, figure selection and submission checks. **[TEAM CONFIRM]**

***

## 5. Declaration

We confirm that the contribution information in this form is accurate to the best of our knowledge. We understand that each percentage should reflect the agreed contribution to the project and that the signed official form is the final record.

[ ] Basill Agas Anak Heatley Rogers agrees with this record.
[ ] Nathan Sebastian Learmonth agrees with this record.
[ ] Gae Jayden MWINE agrees with this record.
[ ] Muhammad Maqeel bin Muhammad Kahfi agrees with this record.
[ ] Badrul Aliff Aiman bin Badrulmunirzaki agrees with this record.
[ ] Ashley Wallen Anak Winston agrees with this record.
[ ] The team agrees that the final percentages total 100 percent.

Signature and date for Basill Agas Anak Heatley Rogers: ____________________

Signature and date for Nathan Sebastian Learmonth: ____________________

Signature and date for Gae Jayden MWINE: ____________________

Signature and date for Muhammad Maqeel bin Muhammad Kahfi: ____________________

Signature and date for Badrul Aliff Aiman bin Badrulmunirzaki: ____________________

Signature and date for Ashley Wallen Anak Winston: ____________________

***

## 6. Submission notes

Use the official unit form as the signed document. This file is a working draft.

Confirm the final member list and member numbers before printing.

Confirm every contribution entry with the named member.

Confirm the final percentages before the form is signed.

Insert the signed form into the final report or submit it through the required channel.

Do not commit signed forms with personal signatures to the public repository.
