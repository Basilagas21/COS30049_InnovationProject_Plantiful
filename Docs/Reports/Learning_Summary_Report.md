# Learning Summary Report

**Student name:** Basill Agas Anak Heatley Rogers  
**Student ID:** 102778888  
**Unit:** COS30049 Computing Technology Innovation Project  
**Team:** Group 7, Plantiful  
**Target grade:** A  
**Word count:** **[ACTION REQUIRED: Basill, insert final word count after editing]**  
**Submission date:** **[ACTION REQUIRED: Basill, insert official submission date]**

> **Before submission:** Replace every bracketed action marker, remove this note, and confirm that the final PDF uses the official cover sheet. Do not submit this Markdown file as the final report.

---

## 1. Project Summary

Plantiful is a biodiversity record management prototype built for a conservation field context. The problem was not simply that paper records are old. The real problem was that field observations, approval decisions, species knowledge and environmental readings were separated across people, devices and spreadsheets. A botanist could record a plant in the field, but that record might not reach an officer quickly. An officer could approve a record, but a visitor could not easily see trusted public information. Sensor readings could show a threat, but the reading was not connected to the record and review process in a way that supported a decision.

Group 7 built a system that connects those parts. The mobile application supports offline field capture with photographs, GPS coordinates and QR identifiers. The web application supports species knowledge, officer review, reporting, maps and a public visitor view. Supabase provides authentication, PostgreSQL data storage, row-level security and file storage. A lightweight IoT path carries sensor readings into the same system so that temperature, humidity and soil moisture can be monitored alongside plant records. The final prototype also includes an AI Field Assist feature, a staff allowlist for controlled staff role assignment and password reset support.

My role was Team Lead, with direct work on the mobile application, field data capture, integration and security evidence. I also coordinated tasks, reviewed pull requests, checked documentation and helped keep the team's evidence aligned with what the system actually did. This mattered because the project was not only a coding exercise. It required us to show that the system was usable, secure, tested and defensible.

The outcome was a working prototype with a shared backend and a shared permission model. The web test suite collected 56 tests, with 46 passing and 10 gated live checks skipped in the default offline run. The mobile suite reached 30 passing tests and the IoT suite reached 36. The production build completed. The security work raised 12 findings, fixed 11, and recorded a mitigation for the remaining one. Several release checks remain outstanding, including the final live database migration, the final ZAP re-scan and the rotation of an exposed development credential. I think that is the honest result. The project delivered a credible integrated prototype, not a finished production service.

## 2. Learning Summary

### 2.1 What I learned about applying computing technology innovation

The main lesson I learned is that innovation is not the same as adding a new technology. A feature only becomes innovative in practice when it removes a real constraint for the user. The mobile app is a good example. Camera capture, GPS and QR scanning are not new technologies on their own. They became useful because they reduced the amount of manual transcription a botanist had to do in the field and because the offline queue allowed the work to continue when the network did not.

I also learned that technical novelty has to survive the operating context. A cloud-first design looks clean in a diagram, but field work happens in places with weak connectivity, limited battery and devices that may be shared or damaged. That is why the mobile app uses a local SQLite store and an explicit sync state rather than assuming that every action reaches the server immediately. The user needs to know whether a record is saved locally, waiting to sync, synced, in conflict or failed. Hiding those states would make the interface look simpler, but it would make the system less trustworthy.

The AI Field Assist feature taught me a similar lesson. A language model can produce a helpful draft, but it cannot be treated as a source of truth for species identification. The design therefore needs human review, clear evidence boundaries and a fallback when the service is unavailable. I now judge an innovation by its failure behaviour as much as by its happy path.

I also learned that integration is where innovation becomes visible. The mobile app, web app, database and IoT bridge were more valuable together than as separate demonstrations. A sensor alert that can be seen beside a plant record, or an officer decision that changes what a visitor can see, is a system-level outcome. Building that required shared data types, shared roles and shared assumptions about what a record state means.

### 2.2 What I learned about SDLC models

Before this project I understood software development life cycle models mainly as diagrams. I now understand them as different ways of managing uncertainty. A waterfall approach would have forced us to settle requirements before we had seen how the field workflow actually behaved. That would have been risky because the client context, the device constraints and the approval rules were still becoming clear. An iterative and incremental approach gave us room to build a vertical slice, test it and adjust the next slice.

Scrum was useful because it gave us short feedback loops, a visible backlog and regular review points. Sprint planning helped us turn a broad project brief into work that could be completed and demonstrated. Sprint reviews forced us to show something real rather than describe an intention. The retrospective helped us identify problems such as unclear ownership, environment drift and evidence gaps.

I also learned the limits of applying Scrum mechanically. A student project still needs phase gates for security, client sign-off and final documentation. Pure Scrum can understate the value of a formal security assessment if the team only focuses on working software. Our better approach was a hybrid one. We used iterative delivery for the product and explicit gates for security, integration and release evidence. That combination matched the assessment requirements better than either extreme.

The biggest process lesson was that "done" needs a definition that includes evidence. A task is not done because the code compiles. It is done when the behaviour is checked, the result is recorded and another person can understand what was verified. This changed how I reviewed work. I started asking for the test output, the screenshot, the migration state or the reproduction steps rather than accepting a verbal update.

### 2.3 What I learned about cloud-based solutions

Supabase reduced the amount of infrastructure we had to build. Authentication, PostgreSQL, file storage and a generated API were available without us running our own server. That let a small team focus on product behaviour instead of spending the whole project on account management and database operations.

The trade-off is that cloud services move risk into configuration. A table can exist and still be unsafe if row-level security is wrong. A storage bucket can work in the UI and still expose files if the policy is too broad. A key can be convenient in development and dangerous if it reaches a client bundle. I learned to treat the cloud configuration as part of the application code, not as a settings screen that someone checks once.

Environment separation was another important lesson. A migration that exists in the repository is not the same as a migration that has been applied to the live project. A type definition that is correct in code is not proof that the deployed schema matches it. Near the end of the project we added a staff allowlist migration, but the live database still needed that migration applied and verified. I now include "applied and verified in the target environment" as a separate release check.

I also learned about vendor coupling. Supabase made the project faster, but the team became dependent on its auth model, its policy language and its storage rules. That is an acceptable trade-off for a prototype if the dependency is documented. It would need more thought for a long-term service with data portability, cost planning and exit requirements.

The cloud also changed how I think about access control. The browser and mobile clients should hold only the publishable key. Privileged operations belong on a trusted server. When a service-role key is used, it bypasses row-level security by design, so the surrounding code and host become part of the security boundary. That was a useful practical lesson in least privilege.

### 2.4 What I learned about secure software solutions

Security was the area where my thinking changed the most. At the start I treated security as a scan at the end of the project. I now see it as a set of decisions that run through requirements, design, implementation, testing and release.

The first decision is to define the trust boundary. In Plantiful, the important boundaries were the browser, the mobile device, the Supabase API, the storage bucket, the IoT bridge and the server-only AI route. Once those boundaries were explicit, it became easier to ask which key each component should hold and which identity the database should trust. The answer was consistent. Identity should come from the authenticated session, not from a role value sent by the client.

The second decision is to make the default deny. Row-level security on the application tables meant that a missing policy blocked access rather than opened it. That is a safer default for a system with public, botanist, officer and admin views. I also learned that UI hiding is not access control. A hidden button does not protect a row. The database policy has to enforce the rule.

The third decision is to record evidence. A security claim without a test result is only an intention. The team used static checks, dependency audits, a live policy check, OWASP ZAP passive scans and a manual review against OWASP ASVS and MASVS ideas. The policy check produced 19 passes and 6 data-dependent skips. ZAP found no High alert after remediation in the historical scan. These results were useful, but they were also bounded. A passive scan is not an active penetration test. A historical scan is not proof that the final deployment is clean.

The fourth decision is to treat secrets as operational objects. An exposed service-role key cannot be fixed by deleting it from a document. It has to be revoked, dependent environments have to be updated and the old credential has to be shown to fail. That work remains a release action in the project. I learned that a clean dependency audit and a passing test suite do not cancel a credential exposure.

### 2.5 What I learned about emerging technologies

The project exposed me to several technologies that are still changing quickly. React Native and Expo made it possible to build a field application with one codebase, but the ecosystem moves fast and version mismatches are a real maintenance cost. The Expo Doctor result showed that a project can build while still carrying dependency and configuration drift. I learned to read tool warnings as design information rather than noise.

Offline-first architecture was another important area. SQLite is mature, but using it well requires more than storing rows locally. It requires a queue, conflict states, retry behaviour and a user interface that explains what happened. I learned that offline support is a product feature, not just a database choice.

MQTT and the IoT path showed me the difference between request-driven and event-driven systems. Sensor data arrives continuously and should not depend on a user opening a page. The bridge that subscribes to the broker and writes into Supabase is a small component, but it changes the shape of the architecture. It also creates a privileged path that needs its own validation and host control.

The AI Field Assist work showed me the practical limits of large language models in a field context. A model can help a user structure an observation or draft a note, but it can also be confidently wrong. The useful design pattern is augmentation with review, not automated authority. The feature also depends on network access, API quotas and key management, so it cannot be treated as a purely local capability.

QR codes were a simpler but effective technology. A stable identifier on a physical tag can connect a field object to a digital record without manual search. The lesson is that low-complexity technology can create high value when it fits the workflow.

### 2.6 What I learned about teamwork and communication skills

As Team Lead I learned that coordination is a technical skill. A team can have strong individual developers and still fail if ownership is unclear, if decisions are not recorded or if two people build against different assumptions. I used GitHub Projects, pull requests and task descriptions to make work visible. I also learned that a task board shows activity, not proof. A card can be marked complete while the evidence is missing.

Communication with the client and tutor taught me to separate what we had built from what we could prove. Early on it was easy to describe the intended system. Later we had to be precise about which parts were implemented, which were tested and which were still pending. That precision improved the report and reduced the risk of overclaiming.

I also learned how much writing affects engineering quality. A clear error message, a useful commit message, a review comment and a test log all reduce the chance of misunderstanding. The team's documentation became more valuable when it included boundaries such as "this was tested on the web build, not the mobile release" or "this migration is written but not applied". Those statements are less exciting than a success claim, but they are more useful.

Conflict and trade-offs were part of the work. We had to choose between adding features and stabilising the existing system. We had to decide when a design change was worth the regression risk. We had to accept that some evidence would remain incomplete before the deadline. I learned to make those trade-offs explicit and to record the consequence rather than pretend that every objective was fully met.

### 2.7 Other relevant knowledge and skills

I developed stronger skills in TypeScript, React and Next.js. I learned how server components, route handlers, middleware and cookie-based sessions fit together. I also learned how easy it is to create a route that looks protected in the navigation but is not protected on the server. That led to a stronger habit of checking authorisation at the data boundary.

Testing became more practical for me. I moved from thinking about tests as a compliance task to using them as a way to describe behaviour. Unit tests for role handling, component tests for forms and API tests for access rules all made the system easier to change. The test count was not the goal. The goal was to catch regressions in the paths that mattered.

I also improved my ability to debug environment problems. Dependency conflicts, stale build caches, missing environment variables, migration order and Windows path issues all cost time. I learned to check the environment before changing the code and to record the fix so that another person could repeat it.

Finally, I learned more about accessibility and usability. Colour alone is not enough to show state. A control needs a label, a focus state and a usable target size. An error message should tell the user what to do next. These ideas are easy to list and harder to apply consistently. The project gave me practice in reviewing screens against real tasks rather than only checking that they rendered.

## 3. Bibliography

Expo (2025) *Expo Documentation*. Available at: https://docs.expo.dev/ (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

Groq (2025) *Groq API Documentation*. Available at: https://console.groq.com/docs (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

MQTT.org (2025) *MQTT: The Standard for IoT Messaging*. Available at: https://mqtt.org/ (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

Next.js (2025) *Next.js Documentation*. Available at: https://nextjs.org/docs (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

Nielsen, J. (1994) *10 Usability Heuristics for User Interface Design*. Available at: https://www.nngroup.com/articles/ten-usability-heuristics/ (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

OWASP Foundation (2021) *OWASP Top 10:2021*. Available at: https://owasp.org/Top10/ (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

OWASP Foundation (2021) *OWASP Application Security Verification Standard 4.0.3*. Available at: https://owasp.org/www-project-application-security-verification-standard/ (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

OWASP Foundation (2025) *OWASP ZAP*. Available at: https://www.zap.org/ (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

Pressman, R. S. and Maxim, B. R. (2020) *Software Engineering: A Practitioner's Approach*. 9th edn. New York: McGraw-Hill.

React Native (2025) *React Native Documentation*. Available at: https://reactnative.dev/docs/getting-started (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

Schwaber, K. and Sutherland, J. (2020) *The Scrum Guide*. Available at: https://scrumguides.org/scrum-guide.html (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

Sommerville, I. (2016) *Software Engineering*. 10th edn. Harlow: Pearson.

SQLite (2025) *Appropriate Uses For SQLite*. Available at: https://www.sqlite.org/whentouse.html (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

Supabase (2025) *Row Level Security*. Available at: https://supabase.com/docs/guides/database/postgres/row-level-security (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

W3C (2023) *Web Content Accessibility Guidelines 2.2*. Available at: https://www.w3.org/TR/WCAG22/ (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).
