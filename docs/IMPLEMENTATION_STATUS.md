# PS26242 RPL Assessment Platform — Implementation Status & Verification Report

**Date:** 2026-10-04  
**Status:** Demo Slice Implemented & Automated-Test Verified (Operational Deployment Pending)  
**Document Version:** 2.2.0  
**Specification Contract:** [PS26242_RPL_Assessment_Platform_Engineering_Specification_v4_2026-10-03_FINAL.md](../PS26242_RPL_Assessment_Platform_Engineering_Specification_v4_2026-10-03_FINAL.md)

---

## 1. Executive Summary

The hackathon demo engineering slice of the **AI-Assisted Skill Assessment Tool for Recognition of Prior Learning (RPL)** for Ministry of Skill Development and Entrepreneurship (MSDE) has been implemented, tested, and automated-test verified. Operational validation and external integration prerequisites remain pending.

All functional gates, integrity boundaries, domain invariants, offline synchronization mechanisms, scoring schemes, and evaluation metrics conform strictly to the primary engineering specification v4.

---

## 2. Component Implementation Status

| Component | Status | Verification & Evidence |
| :--- | :--- | :--- |
| **`@sih26242/contracts`** | **Complete** | All authoritative enums (`WorkflowState`, `RPLPathway`, `RecommendationOutcome`, `AssessorDecision`, `FinalDisposition`, etc.), DTOs, and schemas built and typed. |
| **`@sih26242/domain`** | **Complete** | Pure scoring engine (`calculateOfficialScore`), 3 distinct coverage calculators, pure recommendation engine (`evaluateRecommendation`), and authoritative state machine (`validateStateTransition`). **30 of 30 unit tests passing (T01–T30)**. |
| **`@sih26242/shared`** | **Complete** | SHA-256 crypto, JSON payload canonical hashing, clock skew detection (`checkClockIntegrity`), and secrets-redacted structured logger. |
| **`@sih26242/qualification`** | **Complete** | Target QP: Sewing Machine Operator (`AMH/Q0301`, NSQF Level 3, Version 2.0), Level 1–3.5 Band, RPL-A ($\ge 70\%$ Gate), 5 Compulsory NOS (`AMH/N0301`, `AMH/N0302`, `AMH/N0102`, `AMH/N0103`, `AMH/N0104`), 12 performance criteria, official 400-mark scheme (Theory 106, Practical 246, Viva 48, Project 0; Min Pass 70%), 5 practical tasks (T1–T5), and 12-QP distractor pool. Provenance: `SOURCE-BACKED DEVELOPER FIXTURE`. |
| **`@sih26242/database`** | **Complete** | Prisma schema for PostgreSQL with all models, relationships, and constraints. Schema synchronized on PostgreSQL port **5433**. |
| **`@sih26242/ai`** | **Complete** | `MockAIProvider` (Whisper multilingual Hindi transcription, vision observations, perturbation challenge mode), `validateAIObservation` (mandating evidence references), and `buildModelGovernanceRecord`. |
| **`@sih26242/evaluation`** | **Complete** | 4-assessor balanced crossover study generator, 48h washout validation, ordinal Krippendorff's alpha, bootstrap 95% CI, wrong-AI catch rate. **4 of 4 tests passing**. Provenance: `SYNTHETIC_DEMO`. |
| **`@sih26242/api`** | **Complete** | NestJS modular monolith running on `http://localhost:4000/api`. Validated endpoints: Candidates, Mapping, Assessments, Tasks, Criteria, Evidence, Idempotent Batch Sync, AI Assistant, Data Import, Evaluation Runs, Health/Ready. |
| **`@sih26242/web`** | **Complete** | Next.js 15 responsive mobile-first PWA on `http://localhost:3000`. Tab 1 (Worker self-declaration & mapping), Tab 2 (Supervised practical assessment & evidence capture), Tab 3 (Official scoring, competency profile & finalization), Tab 4 (Evaluation study analytics), real-time NetworkStatusBar with offline simulation, and **"+ New Candidate / Live Assessment" workflow** creating genuine candidates via PostgreSQL and existing REST APIs. |

---

## 3. Verification of Core Engineering Invariants

1. **AI Cannot Certify:**
   - AI outputs are explicitly advisory (`isAuthoritative: false`).
   - Assessor must review and choose `ACCEPTED`, `EDITED`, or `REJECTED`.
   - The finalization endpoint enforces explicit human action.
2. **Deterministic Server-Side Recomputation:**
   - Server recomputes total scores, percentage, mandatory criteria satisfaction, and qualifying rule status inside a PostgreSQL transaction (`$transaction`). Client-submitted totals are ignored.
3. **Official Assessment Scheme Fidelity:**
   - Exact official marks preserved: Theory 106, Practical 246, Viva 48, Project 0 = 400 total marks. Minimum aggregate passing threshold is >= 70% (280 / 400 marks). Passing candidates receive authoritative scores; non-normalized 400-mark scores are recorded and displayed.
4. **Offline Resilience & Finalization Gate:**
   - Disconnected devices can record voice, take photos/videos, and store provisional scores in IndexedDB.
   - When reconnecting, batch sync idempotently applies changes via unique `eventId`.
   - Offline finalization is strictly blocked with HTTP 400 (`isOfflineSubmission: true`).
5. **Upward Override Protection:**
   - Assessor cannot override failed mandatory criteria or failing minimum pass scores into positive certification.
6. **Immutable Locking:**
   - Finalized records (`SIGNED_OFF` or `REPORT_FINALIZED_NOT_RECOMMENDED`) receive `isLocked = true` and `lockedAt`. Normal updates are permanently blocked.
7. **Negative Finalization Path:**
   - Negative assessments finalize to `REPORT_FINALIZED_NOT_RECOMMENDED -> LOCKED` with an upskilling referral report without passing through `SIGNED_OFF`.

---

## 4. Test Verification Summary

- **Domain Recommendation Suite:** 30 / 30 tests passing (`packages/domain/src/recommendation.test.ts`).
- **Evaluation Math Suite:** 4 / 4 tests passing (`packages/evaluation/src/evaluation.test.ts`).
- **End-to-End Workflow Suite:** 15 / 15 tests passing (`tests/e2e/e2e-workflow.test.ts`).
- **Claim Gate & Provenance Suite:** 4 / 4 tests passing (`tests/e2e/claim-gate.test.ts`).
- **Real Evidence Upload Suite:** 8 / 8 tests passing (`tests/e2e/real-evidence-upload.test.ts`):
  - Test 1: Upload known test image -> HTTP 201 -> File exists in storage -> SHA matches
  - Test 2: Upload second image with different content -> Hashes differ
  - Test 3: Tamper client SHA -> Server detects divergence -> HTTP 400 `INTEGRITY_MISMATCH`
  - Test 4: Task Association -> Upload T1 -> T1=captured, T2=pending
  - Test 5: Reload Persistence -> Stored media buffer matches uploaded buffer byte-for-byte
  - Test 6: Tenant Isolation -> Candidate A evidence inaccessible under Candidate B assessment
  - Test 7: Finalization & Audit -> `AuditEvent` records `EVIDENCE_CAPTURED` with valid SHA
  - Test 8: Locked Assessment -> Reject uploads after finalization (`ASSESSMENT_LOCKED`)
- **Playwright Browser E2E Suites:** 6 / 6 passing:
  - `tests/e2e/ui-workflow.spec.ts`: 5 tests (Full interactive preset demo workflow; Live candidate onboarding & end-to-end assessment; GAP-01 Assessment reload persistence; GAP-04 & GAP-05 Rubric scoring & dynamic evidence; GAP-07 & GAP-08 Audit trail & 400-mark package).
  - `tests/e2e/real-evidence-ui.spec.ts`: 1 test (End-to-end browser camera/file selection, real SHA-256 computation, multipart upload, preview rendering, and browser reload persistence).
- **Total Automated Tests:** 67 / 67 tests passing (100% pass rate).

---

## 5. Real Browser Evidence Capture & Durable Storage Architecture

1. **Dual Capture Modes:**
   - **Real File Upload:** Native `<input type="file" accept="image/*,video/*">` enabling local file selection.
   - **Real WebRTC Camera:** Native `navigator.mediaDevices.getUserMedia(...)` with live viewfinder, retake, and snapshot capture.
2. **Cryptographic Integrity (Client + Server):**
   - Exact file bytes hashed in browser via `window.crypto.subtle.digest("SHA-256", buffer)`.
   - Server independently recomputes SHA-256 on received buffer and validates magic bytes (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `52 49 46 46`, WebM `1A 45 DF A3`, MP4 `ftyp`).
   - Hash mismatches trigger immediate HTTP 400 `INTEGRITY_MISMATCH` rejection.
3. **Durable Filesystem Persistence:**
   - Persisted via `EvidenceStorageService` to Docker persistent volume `evidence_storage` mapped to `/app/storage/evidence`.
   - Virtual storage URI: `/evidence/{assessmentId}/{taskCode}/{evidenceId}.{ext}`. Absolute system paths are never exposed.
4. **Visual Rendering & Inspection:**
   - Real media rendered inline on task cards using `<img>` and `<video>` tags.
   - Interactive inspection modal displaying full 64-char SHA-256, byte size, MIME type, and media download.
5. **AI Boundary Disclosure:**
   - Explicit UI and audit disclosure: *"AI visual analysis unavailable in current synthetic demo provider. Assessor review is authoritative."*

---

## 6. Deployment Blockers

**DEMO BLOCKERS: NONE** (Ready for hackathon pitch and live demonstration).

**OPERATIONAL BLOCKERS:**
- Official QP / Source Verification (live NCVET API endpoint integration)
- Organizer Dataset (ingestion of official MSDE candidate data)
- Certified Assessors (National Assessor Registry integration)
- Expert Adjudicator (sector skill council benchmark validation)
- Approved Production AI / Provider Integration (MeitY Bhashini API & production vision infrastructure)
- Empirical Field Study (authorized multi-center assessor field trial)

---

## Final Verification Status

```
========================================================================
DEMO BUILD:                 PASS
EVIDENCE CAPTURE & UPLOAD:  PASS (Real file upload, WebRTC camera, server SHA-256, durable storage)
AUTOMATED TESTS:            67/67 PASS (30 domain, 4 evaluation, 15 workflow, 4 claim-gate, 8 evidence upload, 6 browser E2E)
BROWSER E2E:                PASS (Playwright Chromium, 6 complete end-to-end interactive workflows)
DATA PROVENANCE:            EXPLICIT
QP PROVENANCE:              SOURCE-BACKED DEVELOPER FIXTURE
POLICY CONSISTENCY:         PASS (AMH/Q0301 NSQF Level 3, RPL-A >=70% Experiential Gate)
ASSESSMENT-SCHEME FIDELITY: PASS (Official 400-mark scheme: Theory 106, Practical 246, Viva 48, Project 0; 70% min pass)
EVALUATION:                 SYNTHETIC DEMO ONLY
OPERATIONAL VALIDATION:     PENDING
========================================================================
```
