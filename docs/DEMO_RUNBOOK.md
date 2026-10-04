# Demonstration Runbook (9:30 & 3:00 Tracks): PS26242 RPL Platform

This runbook guides a live evaluator/judge walkthrough of the AI-Assisted RPL Assessment Platform, strictly adhering to verified provenance and non-exaggerated claim boundaries.

---

## 1. Prerequisites & Starting the System

```bash
# 1. Start Docker services (PostgreSQL & Redis)
docker compose up -d

# 2. Seed database with AMH/Q0301 (NSQF Level 3), distractor pool, and candidates
pnpm seed

# 3. Start Backend NestJS API (port 4000)
node apps/api/dist/main.js

# 4. Start Next.js PWA Web Application (port 3000)
pnpm --filter=@sih26242/web start
```

Access the UI at: `http://localhost:3000`

---

## 2. 9:30 Full Demonstration Timeline

| Timestamp | Phase | What to Demonstrate | Screen / Control |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:40** | Worker Profile & Context | Select candidate **Ramesh Verma (CAND-01)**. Show informal worker profile (4 yrs exp), formal education: `NONE` / `EIGHTH`, enrolment: `NONE`. | Tab 1: Candidate Flow |
| **0:40 – 1:25** | Voice Self-Declaration | Play candidate audio in Hindi. Point out preserved original Hindi text, Whisper transcription, and normalized skills chips. | Audio Player & Transcript box |
| **1:25 – 2:15** | QP Mapping & Source Provenance | Show top recommended QP: **Sewing Machine Operator (AMH/Q0301)** at 88% match. Point out **SOURCE-BACKED DEVELOPER FIXTURE** provenance card (Level 3, SHA-256 Checksum, NQR PDF URI: `https://nqr.gov.in/sites/default/files/AMH_Q0301_v2.0%20Sewing%20Machine%20Operator.pdf`). Show distractor pool: Hand Embroiderer (71%), Tailor (58%), Electrician (12%). | Mapping Proposal card |
| **2:15 – 2:45** | NSQF Level 3 & RPL-A Pathway | Explain that NSQF Level 3 (Level 1–3.5 Band) routes to **RPL-A** with `>= 70%` experiential coverage gate. Show AI proposed 80.0%, confirmed by assessor at 80.0% (`Eligible for RPL-A Assessment`). | Experiential Coverage Gate |
| **2:45 – 3:30** | Supervised Physical Tasks | Switch to Tab 2. Point out session code `SES-DEMO-001`, physical center `Delhi Okhla Cluster`, and `[Source: DEMO_FIXTURE]` disclosure. Walk through practical tasks T1–T5. Distinguish **DEMO TASK COVERAGE (5 Tasks)** from **FULL QP ASSESSMENT COVERAGE (400 Marks Total)**. | Tab 2: Practical Tasks |
| **3:30 – 4:05** | Offline Evidence Capture | Click "Simulate Intermittent Disconnect" in network bar (enters `OFFLINE MODE`). Capture Task T3 evidence. Show it queued in **Outbox (1 pending)** in local storage. Reload page to prove persistence. | Network Status Bar |
| **4:05 – 4:40** | Reconnect & Batch Sync | Click "Restore Network" -> click **Sync Outbox**. Watch batch sync apply to server, reset outbox to 0, and append audit events. Foreground sync is the guaranteed reference path. | Sync Outbox button |
| **4:40 – 5:45** | AI Evidence Review | Open AI Evidence Assistant on Task T3. Show video timestamp grounding (`12.0s - 24.5s`). Point out suggested score grounded in official QP practical criterion mark allocation (50/50 practical marks for PC 1.3) and non-authoritative boundary notice. | AI Evidence Panel |
| **5:45 – 6:25** | Human Decision: Accept / Edit / Reject | Click **"Accept Suggestion"** to demonstrate that **AI CANNOT CERTIFY**; only the human assessor can confirm and record authoritative marks. | Assessor action buttons |
| **6:25 – 7:10** | Official Scheme Scoring | Switch to Tab 3. Show official 400-mark components: Theory 82/106, Practical 246/246, Viva 48/48 = Total 376/400 (94%, Min aggregate pass threshold 70%). Show Demo criteria assessed: 12 / 12, Mandatory criteria satisfied: 6 / 6. | Scoring breakdown table |
| **7:10 – 7:50** | Competency Profile | Explain the 3 separate coverages: Mapped (80%), Assessed (100%), Demonstrated (100%). Review all 5 Compulsory NOS cards (`AMH/N0301`, `AMH/N0302`, `AMH/N0102`, `AMH/N0103`, `AMH/N0104`). | NSQF Competency Cards |
| **7:50 – 8:25** | Positive Finalization & Lock | Show recommendation engine output (`Outcome: SUITABLE_FOR_SIGNOFF`). Click **"Human Assessor Sign-Off"**. Watch server recompute scores, engage transactional lock (`RECORD LOCKED`), and generate official certification package. | Finalization Card |
| **8:25 – 8:55** | Negative Referral & Lock | Switch to candidate **Sunita Devi (ASM-DEMO-002)**. Show 50% coverage (`UPSKILLING_REQUIRED`). Click **"Finalize Upskilling Referral"**. Watch server finalize to `REPORT_FINALIZED_NOT_RECOMMENDED` and lock with `RECORD LOCKED (NOT RECOMMENDED)`. | Demo Switcher & Tab 3 |
| **8:55 – 9:30** | Assessor Study Dashboard | Switch to Tab 4. Review 4-Assessor crossover study: Ordinal Krippendorff's Alpha (+0.51 delta), bootstrap CI `[0.31, 0.95]`, and 83.3% wrong-AI catch rate. Point out mandatory `DEMO / SYNTHETIC EVALUATION` disclosure banner. | Tab 4: Evaluation Study |

---

## 3. 3:00 Fast-Track Pitch Timeline

- **0:00 – 0:35:** Candidate informal voice declaration & NSQF Level 3 mapping to `AMH/Q0301` (`SOURCE-BACKED DEVELOPER FIXTURE`).
- **0:35 – 1:10:** RPL-A 70% threshold gate & supervised physical practical tasks (T1–T5) with `[Source: DEMO_FIXTURE]` disclosure.
- **1:10 – 1:45:** Offline evidence capture -> page reload persistence -> network reconnect -> idempotent batch sync.
- **1:45 – 2:15:** Grounded AI evidence suggestions with timestamps; Assessor ACCEPT/EDIT/REJECT controls (AI cannot certify).
- **2:15 – 2:40:** Official scoring under authoritative 400-mark scheme (Theory: 106, Practical: 246, Viva: 48, Total: 400) and NSQF competency profile across 5 compulsory NOS.
- **2:40 – 3:00:** Server-side finalization gate: Positive sign-off generates recommendation package; negative referral finalizes remediation gaps; all records permanently locked.

---

## 4. Final Verification Status

```
========================================================================
DEMO BUILD:             PASS
AUTOMATED TESTS:        PASS (54/54 tests passed)
BROWSER E2E:            PASS (Playwright Edge headless, full interaction)
DATA PROVENANCE:        EXPLICIT (SYNTHETIC_DEMO / SOURCE-BACKED FIXTURE)
POLICY CONSISTENCY:     PASS (AMH/Q0301 NSQF Level 3, RPL-A >=70% Gate)
EVALUATION:             SYNTHETIC DEMO ONLY (Engine verified, field pending)
OPERATIONAL VALIDATION: PENDING
========================================================================
```
