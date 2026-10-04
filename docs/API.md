# API Contract: PS26242 RPL Assessment Platform

Base URL: `http://localhost:4000/api`

---

## 1. Candidate Endpoints

### `POST /api/candidates`
Creates a candidate profile with formal education and enrolment context.
- **Request Body:**
  ```json
  {
    "fullName": "Ramesh Verma",
    "primaryLanguage": "hi",
    "phone": "+91-9876543210",
    "highestFormalEducation": "NONE",
    "currentEnrolment": "NONE",
    "consentVersion": "dpdp-2026-v1"
  }
  ```
- **Response:** `201 Created` with Candidate object.

### `POST /api/candidates/:id/experience`
Records voice or text self-declaration statement.
- **Request Body:**
  ```json
  {
    "rawText": "Main industrial single needle lockstitch machine chalata hoon...",
    "detectedLanguage": "hi",
    "declaredTasks": ["Lockstitch sewing", "Safety guard inspection"],
    "declaredTools": ["Single needle lockstitch machine"],
    "declaredOutputs": ["Stitched shirt panels"],
    "yearsExperience": 4
  }
  ```

### `GET /api/candidates/:id`
Retrieves candidate record, experience statements, and associated assessments.

---

## 2. Qualification & Mapping Endpoints

### `GET /api/qualifications`
Lists all active Qualification Versions in the database.

### `GET /api/qualifications/:id`
Retrieves qualification with full NOS, Criteria, and Assessment Scheme.

### `POST /api/candidates/:id/mapping`
Triggers qualification mapping against candidate's declared experience.
- **Response:**
  - `topCandidates`: Ordered array with target and distractor QPs, relevance scores, and matched tasks.
  - `governance`: Snapshot with model name, version, and input/output SHA-256 hashes.

---

## 3. Assessment Endpoints

### `POST /api/assessments`
Initializes a new assessment attempt.
- **Request Body:**
  ```json
  {
    "candidateId": "CAND-01",
    "qualificationCode": "AMH/Q0301",
    "assessorId": "ASR-01",
    "siteId": "SITE-01",
    "assessorConfirmedMappedCoverage": 80.0
  }
  ```

### `GET /api/assessments/:id`
Retrieves assessment detail, current workflow state, task list, and sessions.

### `POST /api/assessments/:id/start`
Starts a physical supervised assessment session.
- **Request Body:** `{"assessorId": "ASR-01", "deviceId": "tablet-01"}`
- **Transitions:** `ASSESSMENT_READY -> ASSESSMENT_IN_PROGRESS`.

### `PATCH /api/assessments/:id/criteria/:criterionId`
Records an assessor criterion evaluation.
- **Request Body:**
  ```json
  {
    "assessorId": "ASR-01",
    "status": "DEMONSTRATED",
    "practicalMarks": 9,
    "theoryMarks": 0,
    "vivaMarks": 0,
    "assessorNote": "Standard seam observed",
    "evidenceOpened": true
  }
  ```

### `GET /api/assessments/:id/profile`
Computes and returns the real-time NSQF Competency Profile and official score breakdown.

### `GET /api/assessments/:id/recommendation`
Evaluates the pure recommendation engine and reports evaluated state and system outcome.

### `POST /api/assessments/:id/finalize`
Authoritative server-side transactional finalization.
- **Request Body:**
  ```json
  {
    "assessorId": "ASR-01",
    "action": "SIGN_OFF", // or "FINALIZE_REFERRAL"
    "requestedFinalDisposition": "SUITABLE_FOR_SIGNOFF",
    "rationale": "Met all criteria in supervised physical demonstration."
  }
  ```
- **Invariants:**
  - Rejects offline submissions (`isOfflineSubmission: true`).
  - Rejects upward overrides if mandatory criteria failed or minimum score was not achieved.
  - Transitions to `SIGNED_OFF` (positive) or `REPORT_FINALIZED_NOT_RECOMMENDED` (negative).
  - Locks record (`isLocked = true`).

---

## 4. AI Assistant Endpoints

### `POST /api/ai/transcribe`
Multilingual audio transcription with Hindi Whisper model.

### `POST /api/ai/analyze-evidence`
Extracts grounded observable claims from evidence media. Validates that every claim references an evidence ID and criterion ID.

### `POST /api/ai/suggest-score`
Proposes scores strictly aligned to the official qualification marks scale. Non-authoritative.

---

## 5. Offline Sync Endpoints

### `POST /api/sync/batch`
Applies an idempotent batch of queued events from disconnected devices.
- Performs event deduplication via `eventId`.
- Evaluates clock skew against the 300s drift threshold.
- Appends audit events.

### `GET /api/sync/changes?cursor=0`
Fetches incremental changes since the provided version cursor.

---

## 6. Evaluation Study Endpoints

### `POST /api/evaluation/runs`
Generates a balanced crossover study schedule across 4 independent assessors and 36 cases.

### `GET /api/evaluation/runs/:id/metrics`
Computes ordinal Krippendorff's alpha, bootstrap 95% confidence interval, and wrong-AI challenge catch rate.
