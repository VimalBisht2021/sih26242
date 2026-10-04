# AI-Assisted Skill Assessment Tool for Recognition of Prior Learning (RPL)

> **Smart India Hackathon (SIH) 2026 — Problem Statement 26242**  
> **Ministry of Skill Development and Entrepreneurship (MSDE)**  
> *An evidence-centered, policy-compliant, human-governed assessment platform bridging informal craftsmanship to National Skills Qualification Framework (NSQF) credentials.*

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [What This Project Does](#what-this-project-does)
- [Core Governance Invariant](#core-governance-invariant-ai-can-help-ai-cannot-certify)
- [Key Features](#key-features)
- [End-to-End Workflow](#end-to-end-workflow)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Core Domain Model](#core-domain-model)
- [AI Architecture & Boundary](#ai-architecture--governance-boundary)
- [Evidence & Cryptographic Integrity](#evidence--cryptographic-integrity)
- [RPL Policy & Assessment Scheme](#rpl-policy--assessment-scheme)
- [Offline Capture & Synchronization](#offline-capture--synchronization)
- [Auditability & Finalization Locking](#auditability--finalization-locking)
- [Demonstration Guide](#demonstration-guide)
- [Running with Docker (Recommended)](#running-with-docker-recommended)
- [Running Locally (Development Mode)](#running-locally-development-mode)
- [Environment Variables](#environment-variables)
- [Database Setup & Migrations](#database-setup--migrations)
- [Seed Data & Reference Profiles](#seed-data--reference-profiles)
- [API Overview](#api-overview)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Verification Status](#verification-status)
- [Known Limitations & Operational Dependencies](#known-limitations--operational-dependencies)
- [Security & Privacy Considerations](#security--privacy-considerations)
- [Future Scope](#future-scope)
- [License](#license)

---

## Problem Statement

In India, over **90% of the vocational workforce** acquires trade skills through informal, on-the-job apprenticeships, family traditions, or unorganized work rather than formal vocational institutes. While these artisans and technicians possess deep practical mastery, they lack certified credentials, barring them from formal credit, government procurement, and overseas employment.

The **Recognition of Prior Learning (RPL)** initiative under the National Council for Vocational Education and Training (NCVET) provides a pathway to assess and certify these competencies. However, field execution faces critical challenges:
1. **Unstructured Prior Experience:** Informal workers describe their competencies colloquially in regional dialects, making manual mapping to National Occupational Standards (NOS) labor-intensive and subjective.
2. **Fragmented, Ephemeral Evidence:** Practical on-site assessments lack tamper-evident proof linking candidate physical execution to final marks.
3. **Complex, Level-Aware Routing:** Policies governing direct RPL-A (NSQF Level 1–3.5 with $\ge 70\%$ experiential coverage) versus bridge training (RPL-B/C) are applied inconsistently.
4. **Credential Integrity & Vulnerability:** High-throughput field assessments are susceptible to computational errors, grading fatigue, and unverifiable sign-offs.

---

## What This Project Does

This platform is an **evidence-centered RPL assessment workbench** designed for certified field assessors and vocational candidates. It operationalizes the complete skill recognition lifecycle:
- **Intake & Normalization:** Captures informal voice and text experience statements in regional languages (demonstrated in Hindi and English) and normalizes them into structured skills.
- **Semantic Qualification Mapping:** Matches normalized skills against the National Qualifications Register (NQR) catalog, identifying the best-fit Qualification Pack (QP) and computing experiential coverage.
- **Policy-Aware Pathway Gating:** Enforces NSQF level-aware routing rules, verifying that candidates meet the 70% experiential threshold before authorizing direct practical assessment.
- **Supervised Practical Assessment:** Coordinates hands-on task evaluation, attaching geotagged, proctored multimedia evidence with SHA-256 cryptographic digests.
- **Advisory AI Assistance:** Provides non-authoritative multi-modal evidence observations and criterion mark suggestions to assist the assessor.
- **Criterion Rubric Grading:** Enables assessors to grade candidates individually against official component rubrics (Practical, Theory, Viva).
- **Deterministic Server Recomputation:** Bypasses client-side arithmetic to recompute total scores, percentages, and qualifying rules on the server inside an atomic database transaction.
- **Immutable Locking & Audit:** Permanently freezes certified dossiers (`isLocked: true`) and logs every scoring delta and state transition to an append-only audit ledger.

---

## Core Governance Invariant: AI Can Help. AI Cannot Certify.

A foundational architectural decision governs this entire platform:

$$\mathbf{AI\ CAN\ HELP.\ AI\ CANNOT\ CERTIFY.}$$

1. **Non-Authoritative Role:** All AI outputs (voice transcripts, semantic qualification scores, and video evidence observations) are flagged with `isAuthoritative: false`.
2. **Human Assessor Prerogative:** The certified human assessor must explicitly review every AI suggestion, choosing to **Accept**, **Edit**, or **Reject** the observation.
3. **Deterministic Math:** Final grades, qualifying component minimums, and pass/fail thresholds are strictly computed by deterministic TypeScript math (`calculateOfficialScore`), never by generative models.
4. **Mandatory Human Sign-Off:** An assessment can only be finalized by an authenticated assessor confirming an interactive checklist safeguard.
5. **No Upward Overrides:** Assessors cannot override failed mandatory safety criteria or sub-threshold marks into a passing certification without formal remediation.

---

## Key Features

- **Dynamic Multi-Candidate Isolation:** Create completely fresh candidates on the fly via the `+ New Candidate / Live Assessment` flow; multiple candidates maintain distinct UUIDs and zero cross-session state leakage.
- **Reload & Resume Resilience:** Assessment sessions persist across hard browser refreshes through PostgreSQL synchronization and local storage hydration.
- **Zero Score Fallbacks:** Unassessed candidates strictly display `0 / 400 Marks` and `Not Yet Assessed`; no dummy percentages or fabricated grades exist in the codebase.
- **NIST FIPS 180-4 SHA-256 Evidence Hashing:** Photos and video clips are cryptographically hashed upon capture to ensure non-repudiation and tamper detection.
- **Rural Offline Synchronization:** Disconnected testing terminals queue evidence and provisional rubrics in IndexedDB, reconciling idempotently via batch synchronization upon reconnection.
- **Dual Exit Dispositions:** High-scoring candidates achieve positive qualification sign-off (`SIGNED_OFF`); candidates below threshold receive a formal, locked **Upskilling Referral Gap Report** (`REPORT_FINALIZED_NOT_RECOMMENDED`).
- **Psychometric Crossover Evaluation:** Built-in evaluation suite generating balanced 4-assessor crossover trials with 48-hour washout validation, ordinal Krippendorff's alpha ($\alpha$), and wrong-AI perturbation challenge detection.

---

## End-to-End Workflow

```
Candidate Experience (Voice/Text)
               │
               ▼
   Semantic Qualification Mapping
               │
               ▼
   Experiential Coverage Gate (≥ 70%)
               │
               ▼
   Supervised Practical Tasks (T1–T5)
               │
               ▼
   Geotagged Multimedia Evidence (SHA-256)
               │
               ▼
   AI Advisory Observation (isAuthoritative: false)
               │
               ▼
   Human Assessor Rubric Grading (12 Criteria)
               │
               ▼
   Deterministic Server Recomputation (400 Marks)
               │
               ▼
   Human Sign-Off Confirmation Modal
               │
               ▼
   Atomic Transaction Lock ($transaction)
               │
               ▼
   Immutable Audit Trail + Certified Dossier
```

---

## System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │                   FIELD ACTORS                         │
                    │   Candidate (Voice Intake)  |  Certified Assessor      │
                    └──────────────────────────┬─────────────────────────────┘
                                               │
                                               ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. PRESENTATION LAYER (Next.js 15.5.27 + React 19)                                         │
│    • Tab 1: Onboarding, Dialect Intake & Semantic Qualification Mapping                    │
│    • Tab 2: Supervised Practical Execution & Geotagged Media Capture                       │
│    • Tab 3: Official 400-Mark Rubric Scoring & Transactional Sign-Off Safeguard            │
│    • Tab 4: Crossover Psychometric Study & Inter-Rater Reliability Dashboard              │
│    • NetworkStatusBar: Offline Simulation & IndexedDB Local Outbox Queue                   │
└──────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                               │ HTTP / RESTful API (Port 4000)
                                               ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. APPLICATION CORE (NestJS 11.0.11 Modular Monolith)                                      │
│    • Controllers: Candidates, Mapping, Assessments, Tasks, Evidence, Criteria, Sync       │
│    • Idempotent Batch Sync Service: Deduplication, Monotonic Clock Verification            │
│    • Transactional Finalization Service: Prisma Interactive $transaction Lock              │
└───────────────────────┬──────────────────────────────┬─────────────────────────────────────┘
                        │                              │
                        ▼                              ▼
┌────────────────────────────────────────┐   ┌───────────────────────────────────────────────┐
│ 3. PURE DOMAIN ENGINE                  │   │ 4. GOVERNED INTELLIGENCE ABSTRACTION          │
│    (@sih26242/domain)                  │   │    (@sih26242/ai)                             │
│    • State Machine Oracle (14 States)  │   │    • MockAIProvider (Deterministic Rules)     │
│    • Level-Aware RPL Policy Engine     │   │    • Semantic Skill Normalization             │
│    • Deterministic 400-Mark Calculator │   │    • Vision Observation Suggester             │
│    • Mandatory Criteria Gatekeeper     │   │    • Governance: isAuthoritative = false      │
└───────────────────────┬────────────────┘   └───────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ 5. PERSISTENCE & TRUST LAYER                                                               │
│    • PostgreSQL 16 (Port 5433 Host / 5432 Internal): Relational Store with FK Cascades     │
│    • Prisma ORM 6.4.1: Type-Safe Data Client & Baseline Schema Migrations                  │
│    • Redis 7 (Port 6379): Background Task & Event Queue Cache                             │
│    • SHA-256 Ledger: Cryptographic Digest Store & Append-Only AuditEvent Stream            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Implemented Technology | Version | Purpose in Codebase |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) | `15.5.27` | Responsive mobile-first PWA for field assessors |
| **UI Runtime** | React | `19.0.0` | Declarative user interface components |
| **Styling** | Vanilla CSS Tokens / Tailwind | `v3.4.1` | High-contrast, responsive UI styling |
| **Icons** | Lucide React | `0.475.0` | Accessible vocational iconography |
| **Backend** | NestJS | `11.0.11` | Modular enterprise backend monolith |
| **Language** | TypeScript | `5.7.3` / `5.9.3` | End-to-end type safety across packages |
| **Database** | PostgreSQL | `16-alpine` | ACID-compliant relational data and audit ledger |
| **ORM** | Prisma ORM | `6.4.1` / `6.19.3` | Schema definition, migrations, and query client |
| **Cache/Queue** | Redis | `7-alpine` | Distributed event queue and synchronization cache |
| **Monorepo** | pnpm Workspaces | `10.x` | Isolated multi-package workspace management |
| **Containers** | Docker Engine & Compose | v29.1 / v2.40 | Multi-stage production containerization |
| **E2E Testing** | Playwright (Chromium) | `1.63.0` | Headless browser integration and workflow testing |
| **Unit Testing** | Node.js Test Runner | Native Node 22 | Fast, zero-dependency domain unit test execution |
| **Hashing** | Node.js Crypto | NIST SHA-256 | Cryptographic media hashing and tamper detection |

---

## Repository Structure

```
sih26242/
├── apps/
│   ├── api/                     # NestJS backend application (Port 4000)
│   │   ├── src/                 # Controllers, modules, and domain services
│   │   └── dist/                # Transpiled production server artifacts
│   └── web/                     # Next.js 15 frontend application (Port 3000)
│       ├── src/app/             # Next.js App Router pages and global layouts
│       ├── src/components/      # Interactive tabs, onboarding modals, network bar
│       └── src/lib/             # Browser IndexedDB offline storage utilities
├── packages/
│   ├── ai/                      # Governed synthetic AI provider and validation schemas
│   ├── contracts/               # Shared TypeScript DTOs, interfaces, and enums
│   ├── database/                # Prisma schema, client instance, and SQL migrations
│   ├── domain/                  # Pure scoring math, state machine oracle, and policy logic
│   ├── evaluation/              # Psychometric crossover design and Krippendorff alpha math
│   ├── qualification/           # NQR QP standards catalog, task definitions, and rubrics
│   └── shared/                  # Cryptographic hashing, structured logger, and clock validator
├── docker/
│   ├── api.Dockerfile           # Optimized multi-stage Docker build for backend API
│   ├── web.Dockerfile           # Optimized multi-stage Docker build for Next.js web
│   └── api-entrypoint.sh        # Container startup script (migrations, baseline, auto-seed)
├── docs/                        # Architecture specs, test plans, and verification reports
├── tests/
│   └── e2e/                     # Playwright browser specs and API integration suites
├── docker-compose.yml           # Multi-container orchestration (api, web, postgres, redis)
├── pnpm-workspace.yaml          # Monorepo workspace configuration
├── tsconfig.base.json           # Shared TypeScript compiler settings
└── README.md                    # This document
```

---

## Core Domain Model

The database schema (`packages/database/prisma/schema.prisma`) comprises 12 primary entities enforcing strict relational foreign keys:

1. **`Candidate`**: Core worker profile, personal details, contact info, and verified educational level (`EIGHTH`, `TENTH`, `TWELFTH`, etc.).
2. **`ExperienceStatement`**: Raw voice/text worker transcript, normalized skill tags, and claimed years of trade experience.
3. **`Qualification` & `QualificationVersion`**: Official NQR definition, NSQF level, sector, total marks, and version history.
4. **`NOS` (National Occupational Standard)**: Compulsory qualification modules with credit weights.
5. **`Criterion`**: Individual performance criterion specifying maximum Theory, Practical, and Viva marks.
6. **`Assessment`**: Root assessment dossier tracking candidate, qualification, confirmed RPL pathway, score snapshots, and `isLocked` status.
7. **`AssessmentSession`**: Physical assessment session tracking assigned assessor, site code, GPS coordinates, and session state.
8. **`Task` & `Evidence`**: Practical vocational assignments linking photo/video media URLs, SHA-256 digests, and assessor proctoring attestations.
9. **`CriterionAssessment`**: Actual marks assigned by the assessor per criterion, linking AI observations and assessor override rationales.
10. **`AuditEvent`**: Append-only log recording actor ID, event type (`ASSESSMENT_CREATED`, `SIGNED_OFF`), previous/new state, and timestamp.
11. **`EvaluationRun` & `EvaluationCase`**: Research entities storing counterbalanced crossover evaluation trials and inter-rater reliability scores.

---

## AI Architecture & Governance Boundary

```
[Candidate Voice / Video Evidence]
               │
               ▼
 ┌───────────────────────────┐
 │   AI Provider Interface   │
 │   (packages/ai/provider)  │
 └─────────────┬─────────────┘
               │
               ▼
 ┌───────────────────────────┐
 │      MockAIProvider       │ ◄── [Deterministic Synthetic Engine]
 │  • Hindi Dialect NLP      │
 │  • Rule Vision Suggester  │
 │  • Perturbation Injector  │
 └─────────────┬─────────────┘
               │
               ▼ Output: { observation, suggestedScore, isAuthoritative: false }
 ┌───────────────────────────┐
 │     Human Assessor UI     │
 │  [Accept] [Edit] [Reject] │ ◄── [HUMAN GOVERNANCE BARRIER]
 └─────────────┬─────────────┘
               │ Only assessor action commits to database
               ▼
 ┌───────────────────────────┐
 │   PostgreSQL Relational   │
 │    Criteria Assessment    │
 └───────────────────────────┘
```

- **Pluggable Abstraction:** The codebase defines an `AIProvider` interface. The active implementation is `MockAIProvider`, which generates deterministic Hindi voice transcriptions and computer vision observations for testing and demonstration.
- **Strict Advisory Flags:** All AI payloads carry `isAuthoritative: false` and must link directly to an existing `evidenceId`.
- **Zero Hallucination Scoring:** The AI does not compute aggregate scores; it only suggests component marks for human review.
- **Production Integration Note:** Live cloud endpoints (e.g., MeitY Bhashini for speech or commercial multi-modal vision APIs) can be slotted in via environment configuration (`AI_PROVIDER="bhashini"`) without modifying domain scoring or state machine logic.

---

## Evidence & Cryptographic Integrity

1. **NIST FIPS 180-4 SHA-256 Digests:** Every media artifact submitted generates a cryptographic checksum via `computeSha256()` in `packages/shared/src/crypto.ts`.
2. **Geotagging & Proctoring Attestation:** Evidence items persist latitude, longitude, device timestamp, and a mandatory boolean attestation (`proctoringAttested: true`) confirming direct assessor supervision.
3. **Dynamic Task Badging:** The UI dynamically monitors the `Evidence` table. Unassessed tasks display `⏳ Pending Capture`; captured tasks display `✓ Evidence Captured` with clickable SHA-256 verification badges.

---

## RPL Policy & Assessment Scheme

### Level-Aware RPL Routing Policy
The platform implements official NCVET RPL routing logic:
- **NSQF Level 1 to 3.5 (Informal Workers):** Evaluated against the **RPL-A Direct Assessment Gate**. Candidates with confirmed experiential coverage $\ge 70\%$ proceed directly to practical testing. Candidates below 70% are routed to bridge training.
- **NSQF Level 4 to 6 (Mid-Level Trades):** Candidates with formal schooling (12th / ITI) route to RPL-B; informal workers without schooling route to RPL-C.
- **NSQF Level 6.5 to 8 (Advanced Technical):** Handled under specialized RPL-D frameworks.

### Target Qualification Specification (Fixture)
- **Qualification Pack:** Sewing Machine Operator (`AMH/Q0301`, Version 2.0, NSQF Level 3)
- **Sector Skill Council:** Apparel, Made-Ups & Home Furnishing Sector Skill Council (AMHSSC)
- **Total Marks:** **400 Marks**
  - **Practical:** 246 Marks (61.5%)
  - **Theory:** 106 Marks (26.5%)
  - **Viva Voce:** 48 Marks (12.0%)
  - **Project:** 0 Marks
- **Qualifying Passing Threshold:** $\ge 70.0\%$ (Minimum **280 / 400 Marks**)
- **Compulsory NOS (5 Standards):**
  - `AMH/N0301`: Operate single needle lockstitch machine (120 marks)
  - `AMH/N0302`: Undertake basic maintenance and lubrication (80 marks)
  - `AMH/N0102`: Maintain work area, tools and inspect garment quality (70 marks)
  - `AMH/N0103`: Maintain health, safety and security at workplace (70 marks)
  - `AMH/N0104`: Comply with organizational and industry standards (60 marks)

---

## Offline Capture & Synchronization

In rural testing clusters with intermittent connectivity:
1. **Local Outbox Storage:** The web application intercepts network failures and persists evidence payloads and rubric score drafts into browser `IndexedDB`.
2. **Visual Status Indicator:** The top `NetworkStatusBar` displays live connectivity status, ping latency, and pending sync event counts.
3. **Idempotent Batch Sync:** When connectivity returns, `POST /api/sync/batch` submits queued events. The backend validates clock integrity ($\Delta t \le 300\text{s}$) and applies events idempotently using unique `eventId` tracking.
4. **Finalization Barrier:** **Authoritative sign-off cannot be completed offline.** Submitting `POST /api/assessments/:id/sign-off` with `isOfflineSubmission: true` is strictly rejected by the server with HTTP 400.

---

## Auditability & Finalization Locking

### Positive Certification Path
$$\text{ASSESSOR\_DECISION\_PENDING} \longrightarrow \text{SIGNED\_OFF} \longrightarrow \text{LOCKED}$$
- Candidate satisfies component minimums and achieves $\ge 280 / 400$ marks.
- Assessor confirms finalization safeguard modal.
- Backend commits score snapshots, marks `isLocked = true`, and issues formal NSQF competency certification.

### Negative / Upskilling Referral Path
$$\text{ASSESSOR\_DECISION\_PENDING} \longrightarrow \text{FINAL\_REPORT\_READY} \longrightarrow \text{REPORT\_FINALIZED\_NOT\_RECOMMENDED} \longrightarrow \text{LOCKED}$$
- Candidate scores below passing threshold ($< 280 / 400$).
- System does not discard the candidate; it generates a formal **Diagnostic Upskilling Referral Report** identifying failed NOS modules.
- The record is locked permanently against tampering.

---

## Demonstration Guide

### Option 1: Live Fresh Candidate Journey (Evaluator Recommended)
1. Navigate to **[http://localhost:3000](http://localhost:3000)**.
2. Click **`+ New Candidate / Live Assessment`** in the top header.
3. Enter Candidate Name (e.g., `Devraj Sharma`), Phone, Education (`EIGHTH`), and a trade experience statement:
   > *"I have 5 years experience in garment tailoring, lockstitch machine operation, collar stitching, and bobbin winding."*
4. Click **`Create Candidate & Analyze Experience`**.
5. Observe live semantic mapping to `AMH/Q0301 Sewing Machine Operator` with $\ge 70\%$ coverage routing to **RPL-A Direct Assessment**.
6. Click **`Confirm Pathway & Initialize Assessment`**.
7. Verify fresh empty state (`0 / 400 marks`, all 5 tasks pending capture).
8. Go to **Tab 2**, click **`Simulate Capture`** on Task T1, and inspect the SHA-256 hash badge.
9. Go to **Tab 3**, grade criteria across Practical, Theory, and Viva in the rubric table.
10. Click **`Finalize & Sign Off Assessment`**, confirm the modal, and view the immutable locked state and PostgreSQL audit trail.

### Option 2: Pre-Seeded Reference Presets
- **`ASM-DEMO-001 (Ramesh Verma)`:** Select from the top dropdown to inspect a fully evaluated passing candidate (`378 / 400 Marks`, `94.5%`, `SIGNED_OFF / LOCKED`).
- **`ASM-DEMO-002 (Sunita Devi)`:** Select to inspect an upskilling referral case (`210 / 400 Marks`, `REPORT_FINALIZED_NOT_RECOMMENDED / LOCKED`).

---

## Running with Docker (Recommended)

### Prerequisites
- Docker Engine v24+ and Docker Compose v2.20+
- 4 GB available system RAM

### 1. Clone & Configure
```bash
git clone https://github.com/VimalBisht2021/sih26242.git
cd sih26242
cp .env.example .env
```

### 2. Build & Launch Containers
```bash
# Build optimized multi-stage images
docker compose build

# Start services in detached mode
docker compose up -d
```

### 3. Verify Container Health
```bash
docker compose ps
```
*Expected status: All 4 containers (`sih26242-web`, `sih26242-api`, `sih26242-postgres`, `sih26242-redis`) show `Up` and `healthy`.*

### 4. Seed the Database
```bash
docker compose exec api node /app/apps/api/dist/seed.js
```

### 5. Access the Platform
- **Web Application:** [http://localhost:3000](http://localhost:3000)
- **API Health Check:** [http://localhost:4000/api/health](http://localhost:4000/api/health)
- **API Base:** [http://localhost:4000/api](http://localhost:4000/api)

---

## Running Locally (Development Mode)

### Prerequisites
- Node.js v22.x
- pnpm v10.x (`corepack enable && corepack prepare pnpm@10.5.2 --activate`)
- PostgreSQL 16 running on port `5433` (or update `.env`)
- Redis 7 running on port `6379`

### Setup Instructions
```bash
# 1. Install workspace dependencies
pnpm install

# 2. Generate Prisma Client
pnpm --filter=@sih26242/database exec prisma generate

# 3. Apply database migrations
pnpm --filter=@sih26242/database exec prisma migrate deploy

# 4. Seed demonstration qualification catalog and reference candidates
pnpm seed

# 5. Start development servers in parallel
pnpm dev:api   # Starts NestJS API on http://localhost:4000
pnpm dev:web   # Starts Next.js UI on http://localhost:3000
```

---

## Environment Variables

Configured in `.env` (derived from `.env.example`):

| Variable | Required | Default / Example Value | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Yes | `postgresql://sih_user:sih_password@localhost:5432/sih26242_rpl` | PostgreSQL connection string |
| `REDIS_URL` | Yes | `redis://localhost:6379` | Redis event queue URL |
| `PORT` | Yes | `4000` | Port for NestJS backend API |
| `NODE_ENV` | Yes | `development` / `production` | Node execution environment |
| `JWT_SECRET` | Yes | `super-secret-key-change-in-production` | Secret for API token signing |
| `OFFLINE_AUTH_SECRET` | Yes | `offline-signing-secret-key` | Secret for offline token validation |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000/api` | API endpoint exposed to frontend browser |
| `AI_PROVIDER` | No | `mock` | Active AI provider (`mock`, `bhashini`) |
| `CLOCK_DRIFT_THRESHOLD_SECONDS` | No | `300` | Max allowed timestamp drift for sync events |
| `OFFLINE_AUTH_TTL_HOURS` | No | `24` | Validity window for offline assessor leases |

---

## Database Setup & Migrations

Schema migrations are strictly version-controlled using Prisma:
```bash
# Check migration status
pnpm --filter=@sih26242/database exec prisma migrate status

# Apply pending migrations to database
pnpm --filter=@sih26242/database exec prisma migrate deploy
```
*Baseline migration location: `packages/database/prisma/migrations/20261004000000_init/migration.sql`*

---

## Seed Data & Reference Profiles

Running `pnpm seed` or `docker compose exec api node /app/apps/api/dist/seed.js` initializes:
1. **Assessment Site:** `Delhi Okhla Apparel Skill Cluster - Center 4 (SITE-01)`
2. **Target Qualification:** Sewing Machine Operator (`AMH/Q0301 v2.0`, 12 performance criteria, 400 marks).
3. **Distractor Pool:** 12 standard qualifications across Automotive, Electronics, and Construction for mapping evaluation.
4. **Reference Candidate 1 (Positive):** `Ramesh Verma` (`ASM-DEMO-001`, 378/400 marks, certified).
5. **Reference Candidate 2 (Negative Referral):** `Sunita Devi` (`ASM-DEMO-002`, 210/400 marks, upskilling referral).
6. **Reference Candidate 3 (RPL-B Case):** `Priya Kumari` (Formal ITI education test case).

---

## API Overview

Key REST endpoints exposed by NestJS on `http://localhost:4000/api`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status and uptime metrics |
| `POST` | `/candidates` | Register a new vocational candidate profile |
| `POST` | `/candidates/:id/experience` | Record and normalize candidate experience statement |
| `GET` | `/candidates/:id/mapping` | Execute semantic mapping against qualification catalog |
| `GET` | `/qualifications` | Retrieve active qualification packs and NOS standards |
| `GET` | `/assessments` | List all active, finalized, and locked assessments |
| `POST` | `/assessments` | Initialize assessment with confirmed pathway |
| `POST` | `/assessments/:id/sign-off` | Server-recomputed finalization and transactional lock |
| `PATCH`| `/criteria/:id` | Submit assessor marks for an individual criterion rubric |
| `POST` | `/evidence` | Store task evidence with SHA-256 hash and geolocation |
| `POST` | `/ai/analyze-evidence` | Request advisory AI evidence observation |
| `POST` | `/sync/batch` | Idempotent batch synchronization for offline event queue |
| `GET` | `/evaluation/runs` | Retrieve psychometric crossover study analytics |

---

## Testing & Quality Assurance

The codebase enforces zero-defect quality gates with **58 / 58 passing automated tests**:

```bash
# Run pure domain invariants and recommendation tests (30 tests)
pnpm test:domain

# Run psychometric crossover and Krippendorff alpha math tests (4 tests)
pnpm test:evaluation

# Run end-to-end integration and claim-gate suites (19 tests)
pnpm test

# Run full Playwright headless browser E2E test suite (5 complete workflows)
pnpm exec playwright test
```

### Verified Test Suites Breakdown
- **Domain Invariants (T01–T30):** Validates the RPL-A 70% threshold gate, component minimums math, legal/illegal state transitions, and override rejection rules.
- **Evaluation Math:** Tests 4-assessor crossover matrix generation, 48-hour washout windows, and Krippendorff's alpha bootstrapping.
- **Claim Gate & Provenance:** Enforces provenance disclosures and rejects runs with missing data types.
- **End-to-End Workflows:** Tests complete lifecycle from candidate creation to transactional locking.
- **Playwright Browser E2E:** Automates actual user journeys in headless Chromium, verifying DOM updates, reload persistence, dynamic evidence cards, and rubric grading tables.

---

## Verification Status

| System Capability | Verification Level | Evidence in Codebase |
| :--- | :--- | :--- |
| **Fresh Candidate Creation** | **VERIFIED** | `apps/web/src/components/CandidateOnboardingModal.tsx` |
| **Multi-Candidate Isolation** | **VERIFIED** | Playwright E2E Suite (`ui-workflow.spec.ts`) |
| **Browser Reload Persistence** | **VERIFIED** | `localStorage` + `GET /api/assessments` hydration |
| **Qualification Mapping** | **VERIFIED** | Hybrid semantic matcher (`packages/qualification`) |
| **Per-Criterion Rubric Scoring** | **VERIFIED** | `PATCH /api/criteria/:id` + client/server engine parity |
| **Dynamic Task Evidence Cards** | **VERIFIED** | Dynamic card rendering from PostgreSQL `Evidence` |
| **NIST SHA-256 Integrity** | **VERIFIED** | `packages/shared/src/crypto.ts` |
| **Transactional Sign-Off Lock** | **VERIFIED** | `assessments.service.ts` line 637 (`$transaction`) |
| **Dual Exit Dispositions** | **VERIFIED** | Positive certification & negative upskilling gap reports |
| **AI Evidence Assistance** | **SYNTHETIC ENGINE** | `MockAIProvider` with deterministic advisory rules |
| **Inter-Rater Reliability** | **SYNTHETIC STUDY** | Tab 4 Evaluation Dashboard (`@sih26242/evaluation`) |
| **Qualification Catalog** | **SOURCE-BACKED FIXTURE** | Official public QP standards loaded as database seed |
| **MeitY Bhashini Integration** | **OPERATIONAL DEPENDENCY** | Interface ready; live API key required for field trial |
| **Physical Biometric Terminals** | **OPERATIONAL DEPENDENCY** | Simulated in browser; physical USB scanner requires drivers |

---

## Known Limitations & Operational Dependencies

To maintain strict academic and competition integrity, the following boundaries are explicitly disclosed:
1. **AI Provider Implementation:** The active provider is `MockAIProvider`. It performs deterministic, rules-based dialect normalization and computer vision suggestions to guarantee zero-latency, error-free demonstration without external cloud API costs or network drops.
2. **Qualification Catalog Ingestion:** Qualification Packs are loaded from authentic public NCVET/SSC standards as seed fixtures, not via a live NCVET API sync.
3. **Biometrics & Physical Sensors:** Camera and GPS inputs use standard HTML5 Web APIs or simulated coordinates in development; physical Aadhaar biometric dongles represent an operational hardware dependency.
4. **Psychometric Field Validation:** The inter-rater reliability engine and crossover matrices are fully implemented, but metrics displayed in Tab 4 are generated from synthetic study runs rather than multi-month national assessor trials.

---

## Security & Privacy Considerations

- **Secret Management:** Database passwords, JWT signing keys, and offline secrets are managed exclusively through environment variables; zero hardcoded secrets exist in client bundles.
- **Client Privilege Isolation:** Client applications possess zero direct database access; all mutations pass through NestJS controllers with class-validator DTO sanitization.
- **Cryptographic Immutability:** Finalized assessment records cannot be modified via REST endpoints; attempts to update locked assessments return HTTP 400.
- **Audit Traceability:** Every scoring modification and state change writes an immutable `AuditEvent` recording actor ID, timestamp, and entity diff.

---

## Future Scope

- **Sovereign AI Integration:** Direct integration with MeitY Bhashini speech-to-text endpoints and open-source multi-modal vision models running on edge devices.
- **National Registry Synchronization:** Real-time bi-directional integration with the National Qualifications Register (NQR) and Skill India Digital Hub (SIDH).
- **Physical Hardware Dongles:** Native Android / Linux drivers for STQC-certified biometric fingerprint and iris scanners.
- **Decentralized Verifiable Credentials:** Issuance of tamper-proof W3C Verifiable Credentials stored on DigiLocker.

---

## License

This project is developed for the **Smart India Hackathon 2026** under Problem Statement **PS26242**.  
All rights reserved by the development team and the **Ministry of Skill Development and Entrepreneurship (MSDE)**.
