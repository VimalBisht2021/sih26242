# Domain Model: PS26242 RPL Assessment Platform

## 1. Domain Entities & Hierarchies

### 1.1 Qualification Domain
- **`QualificationVersion`**: Represents an official National Qualifications Register (NQR) QP snapshot.
  - Fields: `id`, `externalCode` (e.g. `AMH/Q0301`), `title`, `nsqfLevel` (e.g. 3), `version` (e.g. `2.0`), `sourceUri`, `sourceChecksum`, `passPercentage` (70%).
- **`NOS` (National Occupational Standard)**:
  - Fields: `code`, `title`, `description`, `isMandatory`, `order`.
  - In `AMH/Q0301`: `AMH/N0301`, `AMH/N0302`, `AMH/N0303`, `AMH/N0304`.
- **`Criterion` (Performance Criterion)**:
  - Fields: `code`, `text`, `mandatory` (boolean), `theoryMarks`, `practicalMarks`, `vivaMarks`, `totalMarks`.
- **`AssessmentScheme`**:
  - Authoritative scheme definition preserving official component distributions (Theory, Practical, Viva).
- **`AssessmentPolicy`**:
  - Versioned policy rules: RPL-A threshold value (`70%`), threshold operator (`>=` vs `>`).

### 1.2 Candidate Domain
- **`Candidate`**:
  - Fields: `fullName`, `primaryLanguage`, `highestFormalEducation`, `currentEnrolment`, `applicantContextSource`, `consentVersion`.
- **`ExperienceStatement`**:
  - Fields: `rawText`, `detectedLanguage`, `normalizedSkills`, `declaredTasks`, `declaredTools`, `declaredOutputs`, `yearsExperience`, `source`.

### 1.3 Assessment & Supervised Session Domain
- **`Assessment`**:
  - Fields: `candidateId`, `qualificationVersionId`, `assessorId`, `siteId`, `workflowState`, `rplPathway`, `systemOutcome`, `assessorDecision`, `finalDisposition`, `isLocked`.
- **`AssessmentSession`**:
  - Fields: `sessionCode`, `deviceId`, `startedAt`, `endedAt`, `proctoringAttested`, `clientTimezone`, `clockSkewSeconds`.
- **`Evidence`**:
  - Fields: `captureId`, `taskCode`, `evidenceType`, `fileUri`, `sha256`, `latitude`, `longitude`, `locationAccuracyMeters`, `locationStatus`, `proctoringStatus`.
- **`CriterionAssessment`**:
  - Fields: `status` (`DEMONSTRATED`, `PARTIAL`, `NOT_DEMONSTRATED`, `MEETS_ANCHOR`), `theoryMarks`, `practicalMarks`, `vivaMarks`, `totalAwardedMarks`, `evidenceOpened`.

---

## 2. Three Distinct Coverage Metrics (Section 12)

The platform strictly isolates three coverage metrics to prevent invalid inferences:

1. **Mapped Experiential Coverage:**
   - Qualification learning outcomes supported by candidate pre-assessment self-declaration.
   - Used *only* for pathway eligibility gating under RPL-A.
2. **Assessed Coverage:**
   - Percentage of applicable criteria that have an explicit, recorded assessment decision.
   - Measures evaluation completeness.
3. **Demonstrated Coverage:**
   - Percentage of criteria verified as demonstrated through assessor-approved physical evidence.
   - Used for the final NSQF competency profile.

---

## 3. RPL Pathway Matrix (Section 10)

| Pathway | NSQF / NCrF Level | Education Context | 70% Experiential Mapping Gate |
| :--- | :--- | :--- | :--- |
| **RPL-A** | Levels 1–3.5 | Informal / No formal education required | **Applies (>= 70% confirmed coverage)** |
| **RPL-B** | Levels 4–6 | Formal education (10th/12th/ITI/Diploma) | Does not apply |
| **RPL-C** | Levels 4–6 | Purely informal, no formal education | Does not apply |
| **RPL-D** | Levels 6.5–8 | Higher Education Context (UG/PG) | Does not apply |
