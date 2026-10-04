# System Architecture: AI-Assisted RPL Assessment Platform (SIH PS26242)

## 1. Executive Summary & Design Principles

The platform implements the engineering contract specified in `PS26242_RPL_Assessment_Platform_Engineering_Specification_v4_2026-10-03_FINAL.md` for the Ministry of Skill Development and Entrepreneurship (MSDE).

### Core Invariants:
1. **AI CAN HELP. AI CANNOT CERTIFY:** The human assessment workflow operates independently of AI. The AI layer is advisory; only human assessors make authoritative criterion decisions.
2. **Deterministic Server-Side Recomputation:** Final scores, minimum pass rules, and competency profiles are recalculated server-side inside transactional boundaries.
3. **Official Qualification Fidelity:** Exactly preserves the NCVET QP assessment scheme (e.g. Sewing Machine Operator `AMH/Q0301`: Theory 30, Practical 50, Viva 20 = 100 max marks, pass >= 70%).
4. **Offline Resilience:** Tasks and evidence capture operate in disconnected environments. Offline finalization is strictly blocked.
5. **Immutable Audit Trail:** Append-only SHA-256 hashed audit events record all decisions and state transitions.

---

## 2. Monolithic Modular Architecture

```
                    ┌─────────────────────────────────────────┐
                    │               Web Client                │
                    │   Next.js 15 PWA • React 19 • TypeScript │
                    │   IndexedDB Offline Queue • Camera/GPS  │
                    └────────────────────┬────────────────────┘
                                         │ REST (HTTP/JSON)
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │             API Gateway/App             │
                    │      NestJS Modular Monolith (Port 4000)│
                    │  Candidates • Qualifications • Mapping  │
                    │  Assessments • Criteria • Evidence      │
                    │  Sync • AI Assistant • Evaluation       │
                    └────────────────────┬────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
    ┌───────────────────────────┐                 ┌───────────────────────────┐
    │     PostgreSQL Database   │                 │        Redis Cache        │
    │  Port 5433 (Prisma ORM)   │                 │        Port 6379          │
    │  Append-Only Audit & Data │                 │     Job Queue / State     │
    └───────────────────────────┘                 └───────────────────────────┘
```

---

## 3. Package Structure

| Package / App | Responsibility |
| :--- | :--- |
| `packages/contracts` | Authoritative TypeScript enums (`WorkflowState`, `RPLPathway`, etc.), DTOs, and schemas. |
| `packages/domain` | Pure business logic: scoring engine, coverage calculators, recommendation engine, state machine. |
| `packages/qualification` | Target QP `AMH/Q0301` definition, 12-QP distractor pool, practical task specifications. |
| `packages/database` | Prisma schema, client generation, migrations, and PostgreSQL connection. |
| `packages/ai` | `MockAIProvider`, model governance records, and structured observation grounding validators. |
| `packages/evaluation` | Balanced crossover schedule generator, ordinal Krippendorff's alpha, bootstrap CI, wrong-AI catch rate. |
| `packages/shared` | SHA-256 crypto, payload canonical hashing, clock integrity checks, and secrets-redacted logging. |
| `apps/api` | NestJS REST API with server-side transactions, sync deduplication, and role authorization. |
| `apps/web` | Next.js mobile-first responsive PWA supporting candidate mapping, assessor review, and study analytics. |

---

## 4. Authoritative State Machine Transitions

```
[MAPPING_PENDING] ────► [PATHWAY_CONFIRMATION_PENDING] ────► [PATHWAY_SELECTED]
                                                                     │
                         ┌───────────────────────────────────────────┘
                         ▼
                 [ASSESSMENT_READY]
                         │
                         ▼
             [ASSESSMENT_IN_PROGRESS] ◄────► [CRITERION_RESOLUTION_REQUIRED]
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
      [SIGNOFF_READY]        [REMEDIATION_REQUIRED]
             │                       │
             ▼                       ▼
   [ASSESSOR_DECISION_PENDING] ◄─────┘
             │
      ┌──────┴─────────────────────────────────┐
      ▼ (Positive)                             ▼ (Negative / Referral)
 [SIGNED_OFF]                          [FINAL_REPORT_READY]
      │                                        │
      ▼                                        ▼
   [LOCKED]                     [REPORT_FINALIZED_NOT_RECOMMENDED]
                                               │
                                               ▼
                                            [LOCKED]
```

---

## 5. Security & Threat Mitigations

| Threat | System Mitigation |
| :--- | :--- |
| **Rubber-Stamping / Automation Bias** | Intentional wrong-AI challenge cases; assessor must explicitly accept, edit, or reject each observation. |
| **Evidence Tampering** | SHA-256 payload and artifact hashing stored with capture metadata. |
| **Score Tampering** | Server-side recomputation from individual criteria marks; client-submitted totals are ignored. |
| **Offline Sign-off Fraud** | Server-side finalization gate strictly rejects offline submissions (`isOfflineSubmission: true`). |
| **Clock Manipulation** | Client and server timestamps captured; `abs(skew) > 300s` flags `CLOCK_DRIFT_REVIEW`. |
| **Sync Replay Attacks** | Unique `eventId` deduplication via PostgreSQL unique constraint. |
| **Upward Override Abuse** | Policy engine strictly blocks upward overrides for mandatory criteria failures or minimum pass failures. |
| **State Tampering** | Immutability lock (`isLocked = true`) freezes all criterion assessments and score snapshots post-finalization. |
