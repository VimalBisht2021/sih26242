# Data Model & Schema Specification: PS26242 RPL Platform

## 1. Relational Schema (PostgreSQL via Prisma ORM)

```
Candidate (1) ─────────── (N) ExperienceStatement
    │
    │ (1)
    │
    ▼
Assessment (N) ────────── (1) QualificationVersion
    │                              │ (1)
    │ (1)                          ▼
    ├─────────── (N) AssessmentSession   NOS (N)
    │                      │ (1)           │ (1)
    │                      ▼               ▼
    │               Evidence (N) ──► Criterion (N)
    │                      ▲               ▲
    │                      │ (1)           │ (1)
    │               EvidenceTrace (N) ─────┘
    │
    ├─────────── (N) CriterionAssessment
    ├─────────── (N) ScoreSnapshot
    ├─────────── (N) RecommendationSnapshot
    └─────────── (N) AuditEvent
```

---

## 2. Table Specifications

### `QualificationVersion`
- `id` (UUID PK): Internal primary key.
- `externalCode` (VarChar): Official QP Code (e.g. `AMH/Q0301`).
- `title` (VarChar): Qualification name.
- `nsqfLevel` (Int): 1 through 8.
- `version` (VarChar): e.g. `2.0`.
- `sourceUri` (VarChar): Official NCVET repository PDF/URL.
- `sourceChecksum` (VarChar): SHA-256 of official specification document.
- `totalTheoryMarks` (Int): Theory maximum marks.
- `totalPracticalMarks` (Int): Practical maximum marks.
- `totalVivaMarks` (Int): Viva maximum marks.
- `passPercentage` (Int): Aggregate passing threshold (default 70%).

### `Candidate`
- `id` (UUID PK): Candidate identifier.
- `fullName` (VarChar): Full worker name.
- `primaryLanguage` (VarChar): e.g. `hi`, `en`, `ta`, `te`.
- `highestFormalEducation` (Enum): `NONE`, `PRIMARY`, `FIFTH`, `EIGHTH`, `TENTH`, `TWELFTH`, `ITI`, `DIPLOMA`, `UG`, `PG`, `OTHER`.
- `currentEnrolment` (Enum): `NONE`, `UG_PURSUING`, `PG_PURSUING`, `OTHER`.
- `applicantContextSource` (Enum): `SELF_DECLARED`, `DOCUMENT_VERIFIED`, `ORGANIZER_DATA`.

### `Assessment`
- `id` (UUID PK): Assessment session identifier.
- `candidateId` (UUID FK -> Candidate).
- `qualificationVersionId` (UUID FK -> QualificationVersion).
- `assessorId` (VarChar): Assessor identifier.
- `siteId` (VarChar FK -> Site): Center identifier.
- `workflowState` (Enum): Authoritative workflow state.
- `rplPathway` (Enum): `RPL_A`, `RPL_B`, `RPL_C`, `RPL_D`.
- `systemOutcome` (Enum): Evaluated recommendation outcome.
- `assessorDecision` (Enum): Human assessor action.
- `finalDisposition` (Enum): `UPSKILLING_REFERRAL`, `SUITABLE_FOR_SIGNOFF`, `NOT_RECOMMENDED`, `REASSESSMENT_REQUIRED`.
- `isLocked` (Boolean): Immutability flag set upon finalization.
- `lockedAt` (Timestamp): Timestamp of authoritative lock.

### `AuditEvent`
- `id` (UUID PK): Event identifier.
- `assessmentId` (UUID FK): Related assessment.
- `actorId` (VarChar): Assessor / device / system identifier.
- `actorRole` (VarChar): `ASSESSOR`, `DEVICE_SYNC`, `SYSTEM`.
- `eventType` (VarChar): e.g. `ASSESSMENT_CREATED`, `SESSION_STARTED`, `SYNC_APPLIED`, `ASSESSMENT_SIGNED_OFF`.
- `payloadJson` (Text): Full structured event data.
- `serverTimestamp` (Timestamp): Trusted server arrival time.
