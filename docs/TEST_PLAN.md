# Test Plan & Verification Matrix: PS26242 RPL Assessment Platform

## 1. Overview & Verification Strategy

The test suite validates the core engineering invariants across unit, domain, integration, and state-machine layers.

---

## 2. Test Matrix: T01 – T30 (Recommendation & Boundary Verification)

| Test ID | Scenario Description | Expected Outcome | Verification Status |
| :--- | :--- | :--- | :--- |
| **T01** | Threshold applies + AI below + Assessor coverage null | `PATHWAY_CONFIRMATION_REQUIRED` | Passed (Unit Test) |
| **T02** | Confirmed coverage strictly below threshold (e.g. 45% < 70%) | `UPSKILLING_REQUIRED` | Passed (Unit + API Test) |
| **T03** | Pathway routing override with documented rationale | State `ASSESSMENT_READY` | Passed (Unit Test) |
| **T04** | RPL-B/C/D formal education bypasses Level 1–3.5 70% gate | Direct assessment routing | Passed (Unit Test) |
| **T05** | Exact 70% coverage with `>=` threshold operator | Meets threshold (`ASSESSMENT_REQUIRED`) | Passed (Unit Test) |
| **T06** | Exact 70% coverage with `>` threshold operator | Fails threshold (`UPSKILLING_REQUIRED`) | Passed (Unit Test) |
| **T07** | Assessor edits AI coverage upward with documented rationale | Uses confirmed value | Passed (Unit Test) |
| **T08** | Incomplete assessment components | `ASSESSMENT_REQUIRED` | Passed (Unit Test) |
| **T09** | Missing required evidence + mandatory criteria failure | `ASSESSMENT_INCOMPLETE` (evidence precedence) | Passed (Unit Test) |
| **T10** | Unresolved criterion + failed mandatory criterion | `ASSESSMENT_REVIEW_REQUIRED` (unresolved precedence) | Passed (Unit Test) |
| **T11** | Mandatory criteria failure | `NOT_SUITABLE_FOR_SIGNOFF` | Passed (Unit Test) |
| **T12** | Official minimum-pass rule failure (e.g. 68% < 70%) | `NOT_SUITABLE_FOR_SIGNOFF` | Passed (Unit Test) |
| **T13** | All configured requirements satisfied | `SUITABLE_FOR_SIGNOFF` (`SIGNOFF_READY`) | Passed (Unit + API Test) |
| **T14** | Reopen assessment for additional physical evidence | Transitions to `ASSESSMENT_IN_PROGRESS` | Passed (Unit Test) |
| **T15** | Attempted upward override on mandatory criteria failure | Override strictly rejected | Passed (Unit + API Test) |
| **T16** | Attempted offline finalization (`isOfflineSubmission: true`) | Finalization strictly blocked (HTTP 400) | Passed (API Test) |
| **T17** | Missing education / enrolment context | `PATHWAY_CONFIRMATION_REQUIRED` | Passed (Unit Test) |
| **T18** | Negative referral finalization | `REPORT_FINALIZED_NOT_RECOMMENDED -> LOCKED` | Passed (API Test) |
| **T19** | Positive sign-off with human assessor action | `SIGNED_OFF -> LOCKED` | Passed (API Test) |
| **T20** | Missing required geolocation or proctoring attestation | Finalization blocked | Passed (Unit Test) |
| **T21** | RPL-A exact boundary evaluation | Evaluates against configured operator | Passed (Unit Test) |
| **T22** | Client vs server scoring mismatch | Server recalculation is authoritative | Passed (Unit + API Test) |
| **T23** | Invalid final disposition value attempted | Throws validation error | Passed (Unit Test) |
| **T24** | Illegal state transition attempted | Transition rejected | Passed (Unit Test) |
| **T25** | Expired offline authorization | Prevents authoritative scoring | Passed (Unit Test) |
| **T26** | Clock drift `abs(skew) > 300s` | Flags `CLOCK_DRIFT_REVIEW` | Passed (Unit + API Test) |
| **T27** | Duplicate sync event with identical `eventId` | Deduplicated idempotently | Passed (API Test) |
| **T28** | Conflicting criterion update between devices | Flagged for explicit resolution | Passed (Unit Test) |
| **T29** | AI returns invalid schema / missing fields | Validation rejects claim | Passed (Unit Test) |
| **T30** | AI claim without evidence reference | Validation rejects ungrounded claim | Passed (Unit Test) |

---

## 3. How to Execute Tests

```bash
# Run all domain unit tests (T01 - T30)
pnpm --filter=@sih26242/domain test

# Run evaluation study tests (balanced crossover, alpha, CI)
pnpm --filter=@sih26242/evaluation test

# Run complete workspace test suite
pnpm test
```
