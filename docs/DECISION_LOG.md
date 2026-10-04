# PS26242 Decision Log

This log records all authoritative architecture and domain decisions for the AI-Assisted RPL Assessment Platform, conforming to [PS26242_RPL_Assessment_Platform_Engineering_Specification_v4_2026-10-03_FINAL.md](../PS26242_RPL_Assessment_Platform_Engineering_Specification_v4_2026-10-03_FINAL.md).

---

## ADR-001: Day-1 Qualification Gate & Demo Qualification Selection
- **Status:** Accepted
- **Context:** Section 3 and Section 51 of the v4 specification require an explicit Day 1 gate recording the actual official QP code, title, NSQF level, applicant context, and RPL pathway. The 70% experiential learning mapping threshold applies only to NCrF/NSQF Levels 1–3.5 (RPL-A).
- **Decision:**
  - **Primary Target QP:** `AMH/Q0301` — Sewing Machine Operator
  - **Awarding Body / SSC:** Apparel, Made-Ups & Home Furnishing Sector Skill Council (AMHSSC) / NCVET
  - **NSQF Level:** 3 (NCrF/NSQF Levels 1–3.5)
  - **RPL Pathway:** RPL-A
  - **Policy Version:** `RPL_POLICY_NCVET_2024_V1`
  - **Threshold Configuration:** `thresholdValue = 70`, `thresholdOperator = '>='` (NCVET Gazette Stage 3 table specification, explicitly configurable as `>` where local policy mandates).
  - **Official Assessment Scheme:** Preserves official component marks: Theory = 30 max marks, Practical = 50 max marks, Viva = 20 max marks (Total 100). Aggregate qualifying mark: >= 70%.
  - **Distractor Pool:**
    - `AMH/Q1001`: Hand Embroiderer (NSQF Level 3)
    - `AMH/Q1947`: Self Employed Tailor (NSQF Level 4, RPL-B/C)
    - `ELE/Q6001`: Assistant Electrician (NSQF Level 3)
- **Rationale:** Sewing Machine Operator is a widely recognized informal-to-formal RPL trade in India with authentic NOS, performance criteria, and rich video/photo practical assessment tasks.

---

## ADR-002: Modular Monolith Repository Architecture
- **Status:** Accepted
- **Context:** The specification explicitly favors a modular monolith over microservices for demo reliability, low latency, and zero distributed-transaction hazards during live hackathon evaluation.
- **Decision:** Use a `pnpm` monorepo structure:
  - `apps/api`: NestJS modular monolith REST API.
  - `apps/web`: Next.js PWA mobile-first frontend.
  - `packages/domain`: Pure TypeScript domain logic, pure recommendation engine, pure scoring engine, state machine.
  - `packages/contracts`: Shared TypeScript DTOs, sync event payloads, AI output contracts.
  - `packages/database`: Prisma ORM client and schema for PostgreSQL.
  - `packages/qualification`: Qualification adapter and structured QP repository.
  - `packages/ai`: AI client abstraction, prompt management, and mock/synthetic provider.
  - `packages/evaluation`: Crossover study runner, Krippendorff's alpha, bootstrap CI, wrong-AI challenge.
  - `packages/shared`: SHA-256 hashing, clock skew detection, common utilities.
- **Rationale:** Strong domain boundary isolation while allowing shared domain logic between frontend and backend.

---

## ADR-003: Canonical Single-Source Scoring & Recommendation Engine
- **Status:** Accepted
- **Context:** Specification Section 29.3 mandates that scoring and recommendation logic must exist once in `packages/domain`. The client may use pure functions for local non-authoritative preview, while the server runs the exact same functions authoritatively at finalization.
- **Decision:** Implement pure functional engines (`calculateScore`, `evaluateRecommendation`, `transitionWorkflowState`) in `packages/domain` with 0 external network/database dependencies.
- **Rationale:** Eliminates client/server scoring divergence (Test T22) and ensures 100% deterministic testability.

---

## ADR-004: State Machine Separation of Workflow State vs Recommendation Outcome
- **Status:** Accepted
- **Context:** Prior specifications blurred workflow state with outcome. v4 strictly separates `WorkflowState`, `RecommendationOutcome`, `AssessorDecision`, and `FinalDisposition`.
- **Decision:**
  - `WorkflowState`: `MAPPING_PENDING`, `PATHWAY_CONFIRMATION_PENDING`, `PATHWAY_SELECTED`, `ASSESSMENT_READY`, `ASSESSMENT_IN_PROGRESS`, `CRITERION_RESOLUTION_REQUIRED`, `REMEDIATION_REQUIRED`, `SIGNOFF_READY`, `ASSESSOR_DECISION_PENDING`, `FINAL_REPORT_READY`, `SIGNED_OFF`, `REPORT_FINALIZED_NOT_RECOMMENDED`, `LOCKED`.
  - `RecommendationOutcome`: `PATHWAY_CONFIRMATION_REQUIRED`, `UPSKILLING_REQUIRED`, `ASSESSMENT_REQUIRED`, `ASSESSMENT_INCOMPLETE`, `ASSESSMENT_REVIEW_REQUIRED`, `NOT_SUITABLE_FOR_SIGNOFF`, `SUITABLE_FOR_SIGNOFF`.
  - `AssessorDecision`: `ACCEPT_RECOMMENDATION`, `PATHWAY_ROUTING_OVERRIDE`, `RECOMMENDATION_OVERRIDE_DOWNGRADE`, `SECOND_REVIEW_REQUEST`.
  - `FinalDisposition`: `UPSKILLING_REFERRAL`, `SUITABLE_FOR_SIGNOFF`, `NOT_RECOMMENDED`, `REASSESSMENT_REQUIRED`.
- **Rationale:** Strict typing prevents impossible or illegal transitions.

---

## ADR-005: AI Boundary and Human Authorization Invariant
- **Status:** Accepted
- **Context:** Core principle: "AI CAN HELP. AI CANNOT CERTIFY."
- **Decision:** AI produces non-authoritative suggestions (`AIObservation`, suggested link, suggested mark/anchor). AI cannot sign off, cannot change marks silently, cannot independently route based on mapping, and cannot bypass mandatory criteria. Server rejects any upward override attempting to convert a mandatory failure or minimum-pass failure to `SUITABLE_FOR_SIGNOFF`.
