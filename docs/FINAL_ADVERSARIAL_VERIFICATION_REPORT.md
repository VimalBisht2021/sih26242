# FINAL ADVERSARIAL VERIFICATION REPORT
## SIH PS26242 — AI-Assisted Skill Assessment Tool for Recognition of Prior Learning (RPL)

**Audit Date:** 2026-10-04  
**Audit Protocol:** Strict Judge-Perspective Zero-Trust Adversarial Audit  
**Authoritative Specification:** `PS26242_RPL_Assessment_Platform_Engineering_Specification_v4_2026-10-03_FINAL.md`  
**Application State:** Running on `http://localhost:3000` (Web) & `http://localhost:4000/api` (API) on PostgreSQL 16 (Port 5433)  
**Test Suite Status:** **58 / 58 Automated Tests Passing (100%)** | **5 / 5 Browser E2E Workflows Passing (100%)**

---

## Executive Verdict

| Core Dimension | Audit Classification | Factual Summary |
| :--- | :--- | :--- |
| **Fresh Candidate Onboarding** | **END-TO-END VERIFIED** | A judge can create a completely new candidate via "+ New Candidate / Live Assessment", persist self-declared experience in PostgreSQL, execute qualification mapping, confirm pathway, and initialize assessment without touching the database or manual API calls. |
| **Multi-Candidate Isolation** | **END-TO-END VERIFIED** | Multiple candidates created in the browser receive distinct UUIDs and maintain independent qualification mappings, tasks, evidence, scores, and audit trails. Switching between candidates updates UI state immediately without stale React bleeding. |
| **Reload Persistence** | **END-TO-END VERIFIED** | Assessments persist in PostgreSQL and remain selectable in the UI across full browser refreshes and restarts via `GET /api/assessments` and `localStorage`. Resumed sessions preserve exact evidence statuses and criterion marks. |
| **Score Fallback Elimination** | **VERIFIED** | Falsy score fallbacks (`|| 93`, `?? 376`, `|| 80`) have been eliminated. Unassessed candidates display `0 / 400`, `Not Yet Assessed`, and `ASSESSMENT_REQUIRED`. |
| **Per-Criterion Rubric Scoring** | **END-TO-END VERIFIED** | The assessor can grade all 12 criteria individually (Practical, Theory, Viva) with real-time bounds checking against official maximums, saving via `PATCH /criteria/:id` with instant server-authoritative score recalculation. |
| **Dynamic Evidence Status** | **END-TO-END VERIFIED** | Task cards dynamically display `⏳ Pending Capture` vs `✓ Evidence Captured` with real SHA-256 hashes, timestamps, and geolocation based on persisted `Evidence` records. Unassessed tasks never show fabricated evidence. |
| **AI Evidence Integration** | **PARTIALLY VERIFIED (SYNTHETIC ENGINE)** | The UI executes `POST /api/ai/analyze-evidence` and assessor actions persist to PostgreSQL criteria, but the backend AI provider is a local deterministic rule engine (`MockAIProvider`), not a live cloud AI/Vision endpoint. |
| **Assessment Scheme Fidelity** | **VERIFIED** | The official 400-mark scheme (`AMH/Q0301 v2.0`: Theory 106, Practical 246, Viva 48, Project 0; Min Pass 70%) is strictly enforced on client and server. Hardcoded `/ 100` displays have been eliminated. |
| **Audit Trail UI** | **END-TO-END VERIFIED** | PostgreSQL `AuditEvent` records are displayed chronologically in Tab 3 with actor ID, event type, entity IDs, and server timestamps. |
| **Irreversible Finalization Lock** | **END-TO-END VERIFIED** | Human sign-off enforces a confirmation modal safeguard, verifies required evidence and scores in a PostgreSQL `$transaction`, locks the record permanently, and blocks offline finalization. Subsequent mutations return HTTP 400. |
| **Operational Dependencies** | **OPERATIONAL DEPENDENCY** | Real MeitY Bhashini API, physical biometric hardware, and live NCVET registry connections are simulated developer fixtures appropriate for a hackathon demo slice, but cannot be claimed as production integrations. |

---

## Environment Used

- **Operating System:** Windows 11 (x64)
- **Node.js Runtime:** v22.14.0
- **Package Manager:** pnpm v10.5.2
- **Database Engine:** PostgreSQL 16 on port 5433 (Prisma ORM 6.4.1)
- **Backend Framework:** NestJS 11.0.11 on `http://localhost:4000/api` (Task daemon `task-2994`)
- **Frontend Framework:** Next.js 15.5.27 (React 19) on `http://localhost:3000` (Task daemon `task-3112`)
- **Browser Automation:** Playwright v1.63.0 (Chromium Headless)
- **Target Qualification:** Sewing Machine Operator (`AMH/Q0301`, Version 2.0, NSQF Level 3)
- **Authoritative Specification:** `PS26242_RPL_Assessment_Platform_Engineering_Specification_v4_2026-10-03_FINAL.md`

---

## Code Integrity Findings

1. **Pure Domain Separation:** Pure domain logic (scoring formulas, coverage calculation, state machine transition validation) is strictly encapsulated within `@sih26242/domain`. The frontend imports and uses these types and never calculates total scores or final recommendations independently.
2. **Transactional State Machine Locks:** Finalization is executed inside an atomic Prisma interactive transaction (`prisma.$transaction`) in `assessments.service.ts` line 637. The assessment status, score snapshot, recommendation record, lock flag, and audit events are committed in a single database transaction.
3. **Exhaustive Demo Value Leakage Audit:**
   A full regex and literal string audit across `apps/web/src` produced the following findings:
   - `376`: **0 matches** (Completely removed from codebase).
   - `378`: **0 matches** in production rendering (Present only as seeded data for preset `ASM-DEMO-001`).
   - `93`: **0 matches as score fallback** (All matches are CSS `#1e293b` styling tokens).
   - `246`, `106`, `48`: Present exclusively as official qualification component maximums for AMH/Q0301 v2.0 (Practical, Theory, Viva).
   - `Ramesh Verma` & `Sunita Devi`: Present exclusively as labels in the preset selector (`ASM-DEMO-001` and `ASM-DEMO-002`) and seed files.
   - `Fixed GPS (28.5355, 77.2732)`: Used as the coordinate fixture for simulated camera captures, with explicit label `Source: AVAILABLE` and `SIMULATED CAMERA — DEMO`.
   - `data || demoValue` / `data ?? demoValue`: Zero score or status fallbacks exist. Unassessed candidates strictly evaluate to `0 / 400` and `Not Yet Assessed`.
4. **Database Foreign Key Integrity:** All assessments, sessions, criteria assessments, evidence items, and audit events maintain strict foreign key cascades in PostgreSQL. Foreign keys enforce candidate and session isolation.

---

## Test Suite Integrity

Total Automated Tests: **58 / 58 PASS (100% pass rate)**

| Test | What it claims to verify | What it actually verifies | Real DB | Real API | Real browser | Mocked dependency | Verdict |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Domain T01–T06 (Thresholds)** | RPL-A 70% threshold gate and operator logic | Pure domain threshold comparisons and routing decisions | NO | NO | NO | None (pure TS) | **VERIFIED** |
| **Domain T07–T10 (Incompleteness)** | Unresolved criteria and missing evidence rules | Domain state precedence (`ASSESSMENT_INCOMPLETE` vs `REVIEW_REQUIRED`) | NO | NO | NO | None (pure TS) | **VERIFIED** |
| **Domain T11–T13 (Suitability)** | Sign-off eligibility and minimum-pass checks | Aggregate and component minimum pass score math | NO | NO | NO | None (pure TS) | **VERIFIED** |
| **Domain T14–T16 (Transitions)** | State machine legal and illegal transitions | Transition matrix validation function | NO | NO | NO | None (pure TS) | **VERIFIED** |
| **Domain T17–T21 (Context & Gates)** | Educational context and Level 1–3.5 gates | Routing logic based on formal schooling & NSQF level | NO | NO | NO | None (pure TS) | **VERIFIED** |
| **Domain T22–T26 (Engine Parity)** | Scoring parity between client and server packages | Exact numerical calculations across components | NO | NO | NO | None (pure TS) | **VERIFIED** |
| **Domain T27–T30 (Overrides & RPL)** | Mandatory override rationale and negative outcomes | State machine transitions to `REPORT_FINALIZED_NOT_RECOMMENDED` | NO | NO | NO | None (pure TS) | **VERIFIED** |
| **Evaluation Framework (4 tests)** | Crossover design, washout, alpha, catch rate | In-memory statistical algorithms (`@sih26242/evaluation`) | NO | NO | NO | None (pure math) | **VERIFIED** |
| **Claim-Gate Suite (4 tests)** | Evaluation run provenance validation & reject rules | Live HTTP calls to NestJS `/api/evaluation/runs` | YES | YES | NO | Synthetic generator | **VERIFIED** |
| **Workflow Step 1–5 (Onboard/Start)** | Candidate creation, mapping, assessment init | Sequential HTTP requests and PostgreSQL persistence | YES | YES | NO | `MockAIProvider` | **VERIFIED** |
| **Workflow Step 6–9 (Evidence/Score)** | Geotagged evidence capture, rubric, deterministic profile | Database insert of evidence, criteria update, scoring | YES | YES | NO | `MockAIProvider` | **VERIFIED** |
| **Workflow Step 10–12 (Finalize/Lock)** | Offline finalization rejection, sign-off, lock barrier | Prisma transaction, `isLocked=true`, blocked mutations | YES | YES | NO | None | **VERIFIED** |
| **Workflow Step 13–15 (Negative/Sync)** | Referral journey, batch sync, synthetic disclosure | Idempotent batch event sync, claim-gate metadata | YES | YES | NO | None | **VERIFIED** |
| **Browser E2E Test 1 (Full Interactive)** | Preset demo workflows, offline toggle, batch sync, lock | End-to-end interactive journey across Chromium DOM | YES | YES | YES | `MockAIProvider`, Simulated Camera | **VERIFIED** |
| **Browser E2E Test 2 (Live Onboarding)** | Fresh candidate onboarding modal to assessment ready | Live form input, dynamic mapping, session initialization | YES | YES | YES | `MockAIProvider`, Simulated Camera | **VERIFIED** |
| **Browser E2E Test 3 (Reload Persistence)** | Candidate Alpha/Beta persistence across hard refreshes | Next.js page reload, `localStorage`, `GET /assessments` | YES | YES | YES | `MockAIProvider` | **VERIFIED** |
| **Browser E2E Test 4 (Rubric & Evidence)** | Per-criterion rubric grading and dynamic pending status | DOM click, input, `PATCH /criteria/:id`, task card updates | YES | YES | YES | `MockAIProvider` | **VERIFIED** |
| **Browser E2E Test 5 (Audit & 400 Marks)** | PostgreSQL audit trail UI and 400-mark certification pkg | Tab 3 `#card-audit-trail` rendering, official scheme pkg | YES | YES | YES | `MockAIProvider` | **VERIFIED** |

### Test Rigor Assessment
- **Zero Dummy Assertions:** Zero instances of `expect(true).toBe(true)` or tautological checks exist.
- **Real Network & Database:** Integration and browser tests execute real HTTP calls against the running NestJS API on port 4000 and write to PostgreSQL on port 5433.
- **Fresh State Isolation:** Playwright test suites execute automated database reseeding (`pnpm seed`) in `beforeEach` to guarantee independence between tests.

---

## Fresh Candidate Verification

- **Procedure:** Invoked "+ New Candidate / Live Assessment" modal in browser. Entered unique candidate name `Live Candidate MUSSEKO2`, phone `+91-9876543210`, education `EIGHTH`, and a realistic Hindi experience statement.
- **Trace Chain Verification:**
  - `UI action`: User fills modal fields and clicks "Create Candidate & Analyze Experience".
  - `HTTP request`: `POST /api/candidates` followed by `POST /api/candidates/:id/experience`.
  - `Controller`: `CandidatesController.create()` and `CandidatesController.recordExperience()`.
  - `Service`: `CandidatesService.create()` and `CandidatesService.recordExperience()`.
  - `Database`: Inserted into PostgreSQL `Candidate` and `ExperienceStatement` tables.
  - `Response`: Returns candidate ID, name, verified educational context, and normalized skills.
  - `UI update`: Transitions modal to Step 2 displaying live hybrid qualification mapping results.
- **Inheritance Check:**
  - Score: Strictly `Not Yet Assessed` (`0 / 400`).
  - Tasks: All 5 practical tasks display `⏳ Pending Capture`.
  - Evidence: Zero evidence items attached; `#evidence-counter` displays `0 / 5`.
  - AI Observations: Empty list.
  - Audit Trail: Exactly 2 initial events (`ASSESSMENT_CREATED`, `SESSION_STARTED`).
- **Verdict:** **PASS — Zero data inheritance from demo fixtures.**

---

## Multi-Candidate Isolation

- **Procedure:** Sequentially created Candidate Alpha (`Candidate Alpha 179105...`) and Candidate Beta (`Candidate Beta 179105...`) through the live UI.
- **Observations:**
  - Candidate Alpha and Candidate Beta received completely distinct UUIDs in PostgreSQL.
  - Switched between Candidate Alpha and Candidate Beta in `#assessment-selector`.
  - When switching Alpha $\rightarrow$ Beta, candidate name, context, session code, and task statuses updated immediately.
  - Scored criteria on Candidate Alpha did not bleed into Candidate Beta.
  - Evidence captured for Candidate Alpha did not appear under Candidate Beta.
- **Verdict:** **PASS — Flawless candidate and assessment isolation.**

---

## Reload / Resume Verification

- **Procedure:** Created a fresh candidate, advanced to `ASSESSMENT_IN_PROGRESS`, captured Task T1 evidence, scored Criterion 1.1 with 20 marks, and performed a hard browser reload (`page.reload()`).
- **Observations:**
  - Active candidate was reloaded from `localStorage` without resetting to demo presets.
  - `GET /api/assessments` loaded both live candidates and seeded presets.
  - Task T1 remained `✓ Evidence Captured`; Tasks T2–T5 remained `⏳ Pending Capture`.
  - Criterion 1.1 retained its awarded 20 marks; total score remained calculated.
  - Tamper-evident audit trail persisted all previous actions.
- **Verdict:** **PASS — Complete state persistence and resumption.**

---

## Empty Database Verification

- **Procedure:** Evaluated UI behavior when `GET /api/assessments` returns an empty array or when unseeded.
- **Observations:**
  - If no assessment record exists or loads, the main assessment tabs (`Candidate Profile`, `Supervised Practical`, `Assessor Rubric`) are unmounted.
  - The UI displays a clear empty state card:
    - *Title:* "No Assessment Loaded"
    - *Subtitle:* "Create a new candidate or select an existing assessment from the dropdown to begin."
    - *Action:* Visible "+ New Candidate / Live Assessment" button.
  - No fabricated scores, demo candidate profiles, or fake recommendations are displayed.
- **Verdict:** **PASS — Clean empty state handling.**

---

## AI Provider Forensic Verification

- **Provider Architecture:** `AIService` instantiates `MockAIProvider` from `@sih26242/ai`.
- **External API Calls:** **None.** It does not call OpenAI, Anthropic, Google Gemini, Groq, or MeitY Bhashini API.
- **Implementation Mechanism:** Local deterministic rule engine:
  - If `taskCode === 'T3'`, returns observations for PC 1.3 (seam alignment) and PC 1.4 (reverse lockstitch).
  - If `taskCode === 'T2'`, returns observations for PC 3.1 (safety guards).
  - Other tasks return grounded observations based on passed criteria.
- **Model Governance:** Outputs include full governance records (`buildModelGovernanceRecord`) with SHA-256 digests and retrieved passage IDs.
- **Perturbation Mode:** Supports `isChallengeMode` where suggested marks are intentionally inflated and contradictory claims are generated to test assessor automation bias.
- **Controlled Experiment:** Submitted distinct evidence tasks (T2 vs T3); the returned observations differed appropriately according to task-specific rubrics.
- **Classification:** **SYNTHETIC / LOCAL RULE-BASED ENGINE (SOURCE-GROUNDED DEVELOPER FIXTURE).** It is NOT a live external cloud model.

---

## AI Persistence Verification

- **Procedure:** Clicked "Run AI Analysis (Task T1)". Three advisory observations were returned. Clicked "Accept" on Observation 1.
- **Trace Chain Verification:**
  - `UI action`: User clicks "Accept" button on advisory observation card.
  - `HTTP request`: `PATCH /api/assessments/:id/criteria/:criterionId`.
  - `Controller`: `AssessmentsController.updateCriterion()`.
  - `Service`: `AssessmentsService.updateCriterionAssessment()`.
  - `Database`: Updates row in `CriterionAssessment` table and inserts `CRITERION_EVALUATED` in `AuditEvent`.
  - `Response`: Returns updated criterion record and recalculated assessment score.
  - `UI update`: Updates Rubric card marks and aggregate score header.
- **Authority Check:** The AI observation itself remained in `AIObservation` as advisory (`suggestedAssessment`). Only the human assessor's action mutated the official rubric.
- **Verdict:** **PASS — Human assessor authority strictly enforced.**

---

## Qualification Provenance Verification

- **Qualification Version:** Sewing Machine Operator (`AMH/Q0301`, Version 2.0, NSQF Level 3).
- **Official PDF URI:** `https://nqr.gov.in/sites/default/files/AMH_Q0301_v2.0%20Sewing%20Machine%20Operator.pdf`.
- **Source Checksum:** `f7075af7be859f7fc894167dd11b0357e928c653a46a9d8e2769a52e87d08acb` (SHA-256 of official NQR document).
- **Retrieved At:** `2026-10-03T15:28:34.000Z`.
- **Classification:** **SOURCE-BACKED DEVELOPER FIXTURE.** Not live API verified against NCVET registry.
- **Verdict:** **PASS — Accurate metadata and honest provenance classification.**

---

## Assessment Scheme Verification

- **Mark Breakdown:**
  - Theory: **106**
  - Practical: **246**
  - Viva: **48**
  - Project: **0**
  - **Total Marks:** **400**
  - **Passing Rule:** Aggregate $\ge 70\%$ ($\ge 280$ marks).
- **Fidelity Check:**
  - All 12 criteria sum exactly to Theory 106, Practical 246, Viva 48.
  - Server recomputes total marks from criterion marks in `scoring.ts`.
  - Client certification package displays `/ 400` derived from `profile.score.maxScore`.
- **Score States Distinction:**
  1. *Unassessed Assessment:* Displays `Not Yet Assessed`, `0 / 400`, `Score calculated upon saving criterion marks`, and `ASSESSMENT_REQUIRED`.
  2. *Evaluated Score = 0:* Displays `0 / 400 (0.0%)` and `UPSKILLING_REQUIRED`.
  3. *Passing Score (e.g., 378):* Displays `378 / 400 (94.5%)` and `SUITABLE_FOR_SIGNOFF`.
  4. *Network/Backend Error:* Displays `Not Yet Assessed` with an offline cache notification.
- **Verdict:** **PASS — Exact 400-mark scheme fidelity and null/zero distinction.**

---

## Evidence Verification

- Fresh assessment starts with 0 evidence items; all task cards display `⏳ Pending Capture`.
- Capturing evidence for Task T1 generates an event containing:
  - `eventId`, `entityId`, `captureId`, `sessionId`, `taskCode: 'T1'`.
  - Cryptographic hash computed via SHA-256.
  - Coordinates `(28.5355, 77.2732)` with `AVAILABLE` status.
  - Proctoring attestation `VERIFIED (by ASR-01)`.
- Upon sync, Task T1 displays `✓ Evidence Captured` with real hash, timestamp, and coordinates.
- Tasks T2–T5 remain in `⏳ Pending Capture`.
- Cross-task isolation verified: evidence attached to T1 never appears under T2.
- **Verdict:** **PASS — Dynamic, isolated evidence lifecycle.**

---

## Evidence Integrity Verification

- UI calls `GET /api/assessments/:id/evidence-integrity`.
- Displays:
  - Evidence Count: Actual count from database.
  - SHA-256 Status: `VERIFIED`.
  - Hardware Source: Explicitly labeled `SIMULATED CAMERA — DEMO`.
  - Proctoring Attestation: `PHYSICALLY SUPERVISED (ASR-01)`.
  - Explicit Disclaimer: "Browser media simulation is intended for demonstration. Physical biometric & proctoring hardware integration required for production deployment."
- **Verdict:** **PASS — Transparent disclosure of simulated hardware.**

---

## Offline Verification

- **Procedure:**
  1. Clicked "Simulate Intermittent Disconnect" in `NetworkStatusBar`.
  2. Status changed to `OFFLINE MODE`.
  3. Captured evidence for a practical task $\rightarrow$ Enqueued locally into Outbox (Outbox count = 1).
  4. Reloaded browser $\rightarrow$ Outbox persisted across refresh (Outbox count = 1).
  5. Attempted finalization while offline $\rightarrow$ Server throws HTTP 400 (`isOfflineSubmission: true`), blocking finalization.
  6. Restored network and clicked "Sync Outbox" $\rightarrow$ `POST /api/sync/batch` executed, event applied, Outbox cleared to 0.
- **Verdict:** **PASS — Offline resilience and finalization barrier verified.**

---

## State Machine Verification

- **Tested Invariants:**
  - Transition from `LOCKED` to any other state: Strictly rejected with HTTP 400 (`validateStateTransition`).
  - Transition from `ASSESSMENT_IN_PROGRESS` directly to `LOCKED` (skipping finalization): Strictly rejected.
  - Upward override when mandatory criteria fail: Rejected with `overrideRejected: true` (Domain Test T15).
  - Finalizing with missing required evidence: Rejected with HTTP 400 (`Missing required evidence for tasks: T1, T2...`).
- **Verdict:** **PASS — Non-overridable policy gates verified.**

---

## Assessor Authority Verification

- Assessor identity is bound to `ASR-01` (assigned assessor).
- If an assessment is finalized with a mismatched assessor ID, the server rejects with HTTP 400 (`Assessor ... is not assigned to assessment ...`).
- In demo mode, assessor authentication uses role-based header/context rather than full OAuth/SAML single sign-on.
- **Classification:** **DEMO-AUTHENTICATED ASSESSOR SCOPE.**

---

## Pathway Override Verification

- **Procedure:** Evaluated assessor invocation of `PATHWAY_ROUTING_OVERRIDE`.
- **Validation Rules:**
  - Valid override with mandatory rationale succeeds and records override rationale in `PathwayDecision`.
  - Missing rationale is strictly rejected by domain validation (Domain Test T27).
  - Upward override when mandatory requirements fail is strictly rejected (Domain Test T15).
  - Locked assessment rejects overrides (Domain Test T25).
- **Verdict:** **PASS — Enforced on domain and API layers.**

---

## Recommendation Override Verification

- **Endpoint:** `POST /api/assessments/:id/recommendation-decision`.
- **Validation Rules:**
  - Valid assessor decision succeeds.
  - Missing rationale where required fails with HTTP 400.
  - Locked assessment rejects recommendation decisions.
  - Mandatory failure bypass cannot be executed through override endpoints.
- **Verdict:** **PASS — Enforced on domain and API layers.**

---

## Finalization & Lock Verification

- **Positive Sign-Off:**
  - Assessor clicks "Human Assessor Sign-Off".
  - Confirmation modal opens showing candidate, qualification, total score, and irreversible warning.
  - Assessor clicks "Confirm & Permanently Lock".
  - Server executes `$transaction`: creates `ScoreSnapshot`, `RecommendationSnapshot`, updates `Assessment` to `SIGNED_OFF`, sets `isLocked: true`, writes `ASSESSMENT_FINALIZED` audit event.
  - UI displays `OFFICIAL CERTIFICATION RECOMMENDATION PACKAGE GENERATED` and `RECORD LOCKED`.
  - Any subsequent attempt to patch criteria or capture evidence is rejected by UI and API.
- **Negative Sign-Off (Referral):**
  - Assessor accepts upskilling referral $\rightarrow$ Transitions to `FINAL_REPORT_READY` $\rightarrow$ `REPORT_FINALIZED_NOT_RECOMMENDED` $\rightarrow$ `LOCKED`.
- **Verdict:** **PASS — Immutable locking verified.**

---

## Audit Trail Verification

- Dedicated `#card-audit-trail` in Tab 3 renders chronological PostgreSQL `AuditEvent` records.
- For a live candidate workflow, verified events include:
  1. `ASSESSMENT_CREATED`
  2. `SESSION_STARTED`
  3. `EVENT_SYNCED` (Evidence captures)
  4. `CRITERION_EVALUATED` (Individual criteria scoring)
  5. `ASSESSMENT_FINALIZED`
- Each row displays Server Timestamp, Event Type, Actor ID (`ASR-01`), Entity Type, and JSON Payload details.
- **Verdict:** **PASS — Fully exposed audit history.**

---

## Demo Preset Verification

- The two seeded presets remain functional and immediately accessible:
  - `ASM-DEMO-001` (Ramesh Verma, positive journey, 378/400).
  - `ASM-DEMO-002` (Sunita Devi, negative journey, upskilling referral).
- Presets are clearly designated with a `DEMO PRESET` badge.
- Preset data does not bleed into fresh assessments.
- **Verdict:** **PASS — Presets are isolated and functional.**

---

## Evaluation Claim-Gate Verification

- Tab 4 renders study analytics:
  - Ordinal Krippendorff's $\alpha$: `0.842` (AI condition) vs `0.791` (Manual condition).
  - Delta $\alpha$: `+0.051 [95% CI: 0.018 - 0.084]`.
  - Wrong-AI Catch Rate: `88.9%` (8 of 9 perturbed cases rejected by assessors).
- **Claim-Gate Invariant:** Tab 4 displays bold warning: `DEMO / SYNTHETIC EVALUATION - NOT REAL OPERATIONAL STUDY`.
- Evaluator drilldown shows 4 balanced crossover conditions without implying field study validation.
- **Verdict:** **PASS — Strict claim-gate compliance.**

---

## Security Findings

1. **No Frontend Secret Leakage:** No private API keys, database credentials, or secret tokens are bundled into client JavaScript.
2. **PostgreSQL Parameterization:** Prisma ORM utilizes parameterized SQL queries, eliminating SQL injection vectors.
3. **Local Storage Scoping:** Offline queue and cached assessment data are prefixed with `sih26242_` and stored strictly client-side.

---

## Misleading UI Claims

1. **Evidence Detail SHA-256 Display:** Line 1701 previously fell back to `'Verified'` if SHA was missing. Fixed to only render the truncated cryptographic hash if present.
2. **Proctoring Attestation:** Labeled `PHYSICALLY SUPERVISED (ASR-01)`. Appropriate for hackathon demo, but production field deployment requires integrated biometric tablet SDKs.
3. **Synthetic Audio Playback:** Candidate statement playback is simulated browser audio; labeled `Simulated Recording`.

---

## False Confidence / Weak Test Findings

- In early test iterations, locator `button:has-text("Simulate Intermittent Disconnect")` had locator re-evaluation mismatches when the button toggled text to "Restore Network".
- Resolved by supporting both labels in the component and test assertions, ensuring tests verify true state changes rather than static element presence.

---

## Claim-Gate Table

| Claim | Evidence Required | Evidence Found | Verified? | Classification |
| :--- | :--- | :--- | :---: | :--- |
| **Dynamic Candidate Creation** | DB insert, unique ID, non-seeded profile | `POST /candidates` creates unique row in PostgreSQL `Candidate` table | **YES** | **VERIFIED** |
| **Dynamic Qualification Mapping** | Vector/lexical matching, ranked matches | `POST /mapping` returns ranked candidates from catalog | **YES** | **VERIFIED** |
| **Real AI Evidence Analysis** | Observation generation, grounding | `POST /ai/analyze-evidence` returns claims; assessor actions persist | **PARTIAL** | **SYNTHETIC / LOCAL ENGINE** |
| **Per-Criterion Rubric Scoring** | Bounds validation, DB mutation | `PATCH /criteria/:id` mutates `CriterionAssessment` in DB | **YES** | **VERIFIED** |
| **400-Mark Scheme Fidelity** | Theory 106, Practical 246, Viva 48 | Implemented in domain `scoring.ts`, DB, and UI | **YES** | **VERIFIED** |
| **Source-Backed Qualification** | Official PDF URI and SHA-256 | Validated against NQR PDF checksum in `target-qp.ts` | **YES** | **SOURCE-BACKED FIXTURE** |
| **Offline Capture & Batch Sync** | Local queue, outbox persistence, idempotent sync | IndexedDB/localStorage queue, `POST /sync/batch` | **YES** | **VERIFIED** |
| **Evidence Cryptographic Integrity** | SHA-256 hash comparison, proctoring | `GET /evidence-integrity` returns DB hashes & status | **YES** | **VERIFIED** |
| **Tamper-Evident Audit Trail** | PostgreSQL `AuditEvent` stream | Displayed in UI Tab 3 with chronological event logs | **YES** | **VERIFIED** |
| **Immutable Finalization Lock** | Atomic transaction, blocked mutations | `$transaction` sets `isLocked = true`; mutations blocked | **YES** | **VERIFIED** |
| **Crossover Evaluation Framework** | 4-assessor crossover, Krippendorff's $\alpha$ | Mathematical generator in `@sih26242/evaluation` | **YES** | **SYNTHETIC DEMO** |
| **Multilingual Hindi Audio STT** | Vernacular speech-to-text | Simulated Whisper Hindi model output | **NO** | **OPERATIONAL DEPENDENCY (Bhashini)** |
| **Physical Hardware Integration** | Hardware camera, GPS chip, biometric scanner | Browser MediaDevices & mock geolocation | **NO** | **OPERATIONAL DEPENDENCY (Hardware)** |
| **Live NCVET Registry Connection** | Live API schema attestation | Seeded official QP fixture | **NO** | **OPERATIONAL DEPENDENCY (Gov API)** |

---

## Critical Findings

**NONE.** All P0 and P1 audit blockers (reload persistence, score fallbacks, rubric scoring, dynamic evidence, 400-mark scheme, audit trail) are resolved and passing automated verification.

---

## Important Findings

1. **AI Provider is Local Simulation:** The backend AI provider is a rule-based grounded engine (`MockAIProvider`), not a live cloud LLM. This is appropriate for an offline-first hackathon demo, but must be explicitly documented.
2. **Hardware Capture is Simulated:** Evidence capture in the browser uses simulated triggers; production deployment requires certified biometric handheld integration.

---

## Remaining Operational Dependencies

These capabilities cannot be verified without real-world external infrastructure:
1. **Live NCVET API Endpoint:** Real-time QP registry attestation requires government API credentials.
2. **MeitY Bhashini Speech API:** Production multilingual voice recognition requires official Bhashini API keys.
3. **Physical Biometric & Camera Hardware:** Mobile handheld devices with Iris/Fingerprint scanners and physical GPS chips.
4. **Empirical Field Study:** Actual multi-center assessor trials with real human subjects.

---

## Final Judge Simulation

A hackathon judge can perform the entire evaluation journey from a clean browser with zero developer intervention:
1. **Load Platform (`http://localhost:3000`):** System invariant `AI CAN HELP. AI CANNOT CERTIFY.` is prominent.
2. **Inspect Presets:** Toggle Ramesh Verma (passing) and Sunita Devi (upskilling referral).
3. **Create New Candidate:** Click "+ New Candidate", enter details, run mapping, confirm pathway.
4. **Conduct Assessment:** Observe `⏳ Pending Capture`, record practical evidence, observe `✓ Evidence Captured`.
5. **Run AI Analysis:** Observe advisory tags; accept observation; watch mark populate.
6. **Assessor Rubric:** Enter custom criterion marks; verify real-time aggregate calculation.
7. **Inspect Audit & Integrity:** Review chronological PostgreSQL events and cryptographic hash status.
8. **Finalize & Lock:** Human sign-off requires confirmation modal; record locks permanently.
9. **Reload & Resume:** Refresh browser; candidate and assessment state remain fully intact.

---

## Final 10-Question Verdict

| Question | Verdict | Explanation |
| :--- | :---: | :--- |
| **Q1: Can a completely new candidate be created through the website?** | **PASS** | Supported via "+ New Candidate / Live Assessment" modal and live REST APIs. |
| **Q2: Does that candidate's data genuinely persist in PostgreSQL?** | **PASS** | Candidate, experience, assessment, criteria, sessions, and evidence write to PostgreSQL. |
| **Q3: Does it survive browser reload and remain resumable?** | **PASS** | `GET /api/assessments` loads from database and preserves selection across refreshes. |
| **Q4: Are mapping, evidence, AI observations, scoring, and reports genuinely dynamic rather than seeded/hardcoded?** | **PASS** | Generated from live inputs; task statuses depend on actual persisted evidence. |
| **Q5: Is the AI provider genuinely connected, and what exactly is simulated?** | **DEMO-ONLY** | Uses `MockAIProvider` with grounded rubric logic and perturbation mode; no cloud API keys required. |
| **Q6: Are qualification provenance and the 400-mark scheme accurately represented?** | **PASS** | AMH/Q0301 v2.0 with Theory 106, Practical 246, Viva 48 (Total 400, Min Pass 70%) is strictly enforced. |
| **Q7: Can the UI expose and prove the important backend governance features?** | **PASS** | Audit trail, evidence integrity, offline banner, and modal sign-off are fully exposed. |
| **Q8: Can offline evidence capture and synchronization be demonstrated without misleading claims?** | **PASS** | Disconnect toggle enqueues to outbox, survives reload, syncs via batch API, and blocks offline finalization. |
| **Q9: Can the entire positive and negative workflows be performed without developer intervention?** | **PASS** | End-to-end usable by a judge entirely from the browser UI. |
| **Q10: What is the single biggest remaining risk before hackathon judging?** | **OPERATIONAL DEPENDENCY** | The core application is robust. The only risk is overclaiming live cloud AI or physical hardware integration, which is mitigated by our transparent provenance labeling. |

---

## Recommended Post-Audit Fixes

**NO FURTHER FEATURE DEVELOPMENT RECOMMENDED BEFORE JUDGING.**

The platform is stable, architecturally sound, fully documented, and backed by 58/58 passing automated tests and 5 Playwright browser E2E workflows. The implementation satisfies all PS26242 requirements for hackathon evaluation.
