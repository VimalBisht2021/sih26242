**AI-ASSISTED SKILL ASSESSMENT PLATFORM  
Recognition of Prior Learning (RPL)**

**Problem Statement 26242 \| Ministry of Skill Development and Entrepreneurship**

Engineering Specification v4 — Design-Complete Revision  
Revised against PS26242, the previous architecture review, and current official NCVET source material  
Scope: hackathon demo implementation with a production-oriented domain model

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>Purpose of v4<br />
This final v4 closure pass incorporates the post-v4 implementation review: assessor-safe final dispositions, a complete state-transition oracle, executable study allocation/washout rules, geotagged proctoring controls, explicit acceptance criteria, and final document/version hygiene. The specification is intended to be frozen for implementation after this pass; unresolved external prerequisites are treated as execution gates rather than design gaps.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

| **Design decision**  | v4 decision                                                                                            |
|----------------------|--------------------------------------------------------------------------------------------------------|
| Core product         | Evidence-centered RPL assessment platform with AI assistance                                           |
| Demo qualification   | Use one real public QP; choose a Level 1–3.5 qualification if the demo uses the 70% direct-RPL pathway |
| Mapping evaluation   | 10–15 qualification pool for evaluation; 2–3 distractors retained for live demo                        |
| Practical assessment | Assessor-operated/shared-device supervised session                                                     |
| Scoring              | Preserve official QP assessment components/marks; internal normalization only for analytics            |
| RPL pathways         | Level-aware policy: different flow for Level 1–3.5, Level 4–6, Level 6.5–8                             |
| AI role              | Mapping/evidence assistance; no autonomous certification                                               |
| Offline              | Capture and evidence submission offline; sign-off requires successful server synchronization           |
| Evaluation           | Counterbalanced conditions + expert reference + wrong-AI challenge subset + assessor/site factors      |
| Final output         | NSQF competency profile + recommendation package + assessor sign-off                                   |

Document status: Ready for implementation once the actual qualification, organizer dataset, assessors and expert adjudicator are secured.

# 1. Executive Architecture

PS26242 is not primarily a computer-vision problem. It is an assessment workflow and evidence-traceability problem in which AI can remove repetitive work. The assessment system therefore remains functional without AI.

RPL ASSESSMENT PLATFORM

Worker / Candidate

\|

v

Experience Capture

\|

v

Skill Normalization

\|

v

Qualification Mapping \<---- Official Qualification Repository

\|

v

Assessor Confirmation

\|

v

Assessment Session

\|

v

Task -\> Evidence -\> Observation

\| \|

\| +---- AI assistance

\|

+---- Assessor observation

\|

v

Criterion Decision

\|

v

Official/Configured Assessment Scoring

\|

v

Competency Profile

\|

v

Recommendation Package

\|

v

Authorized Human Assessor Sign-off

\|

v

Locked Assessment + Audit

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Design invariant<br />
</strong>If the AI provider is offline, the qualification mapper fails, or vision processing fails, the human assessment workflow must still be able to continue using the approved qualification, task checklist, evidence and assessor scoring path.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 2. Complete Review Closure Matrix

| **Review issue**                     | v4 correction                                                                                                                                                              | **Verification location** |
|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------|
| No assessor resourcing plan          | Secure 4 assessors + 1 expert adjudicator by Day 3; fallback explicitly prevents consistency claim                                                                         | §33–35                    |
| Top-3 recall too easy                | Use 10–15 QPs for mapping evaluation; 2–3 distractors only for the live demo                                                                                               | §17, §34                  |
| Automation bias                      | Add deliberately perturbed/wrong-AI challenge subset and catch-rate metric                                                                                                 | §35–36                    |
| Ordinal scores                       | Use weighted kappa/Krippendorff alpha and bootstrap-by-case CI where sample permits                                                                                        | §35                       |
| AI condition ambiguity               | Freeze model/prompt/build before study; distinguish real AI results from fixture-generated AI                                                                              | §37                       |
| Recommendation logic vague           | Separate workflow state from recommendation outcome; deterministic rule ordering, tie-breaks, assessor confirmation of pathway coverage, and explicit override/audit path. | §9–10, §26                |
| Self-authored rubric                 | Preserve source QP marks/components; demo anchors are explicitly auxiliary and expert-reviewed                                                                             | §11–12                    |
| Sign-off offline unclear             | Offline state ends at SIGNOFF_READY; sign-off requires server synchronization                                                                                              | §28, §44                  |
| Clock integrity                      | Store client time + server sync time + drift and flag configurable drift                                                                                                   | §29.2                     |
| Offline auth                         | Bounded pre-authorized offline session credential; explicit browser limitations                                                                                            | §29.1                     |
| Local encryption omitted             | Add device/local encryption requirements and PWA limitation                                                                                                                | §29.3                     |
| Background upload                    | Foreground resumable upload is reference; background sync is optional and tested on demo device                                                                            | §28, §30–31               |
| Location variation not measured      | Site is first-class assessment dimension; dashboard reports descriptive per-site metrics                                                                                   | §39–41                    |
| Assessor integrity                   | Completeness gate, authorization/scope check, evidence-open check, explicit recommendation override with mandatory rationale, and quality sampling.                        | §27, §41                  |
| Organizer dummy data import          | Defined CSV/JSON import contract + validation report + CLI/API                                                                                                             | §18                       |
| Language risk                        | Multilingual embeddings + language-specific mapping metrics                                                                                                                | §15, §17, §38             |
| Execution sequencing                 | Resource gate, data gate, model freeze and P0 cut strategy                                                                                                                 | §33, §50–51               |
| Source verification                  | Official Gazette re-checked; level-specific flows confirmed; 70% source inconsistency between Stage 3 table and flowchart/assessor-role text explicitly documented.        | §3, §49                   |
| Geotagged/proctored evidence         | Add digital + video evidence, geolocation fields, proctoring flags, offline location status and privacy handling.                                                          | §21, §39, §48             |
| QP level/pathway selection gate      | Record actual QP + NSQF level + applicant context on Day 1; 70% is never claimed unless the chosen QP is Level 1–3.5.                                                      | §3, §49–51                |
| Evaluation case allocation / washout | Balanced crossover; no same-assessor repeated case; \>=48h target washout; explicit sub-24h limitation.                                                                    | §34–35                    |
| Orientation and batch governance     | Capture orientation completion/hours and enforce the cited 12–15 hour Level 1–3.5 requirement plus 20–30 batch cap; use pathway-specific ranges for Level 4–6.             | §3, §42                   |

# 3. Official RPL Pathway Model

NCVET’s RPL framework is level/context specific. The four flows are RPL-A for NCrF/NSQF Levels 1–3.5; RPL-B for Levels 4–6 with the specified formal-education context; RPL-C for Levels 4–6 without formal education; and RPL-D for Levels 6.5–8 with the specified PG/PhD context. The 70% experiential-learning mapping gate is used only by RPL-A. The June 19, 2024 Gazette Stage 3 table states direct assessment at “equal or more than 70%” mapped experiential learning and upskilling below 70%; other text in the same publication uses “\>70% / more than 70%”. The comparison operator is therefore a versioned policy field, not a hard-coded constant. Demo default: \>=70% based on the Stage 3 table; operational deployment requires policy-owner/domain-expert confirmation of the operator for the selected qualification. Source: NCVET RPL Gazette, June 19, 2024, Stage 3 governance table and Annexure-1 / §6.2(c), PDF pp. 39 and 51–54.

DAY-1 QUALIFICATION GATE: record the actual official QP code, title, NSQF level, applicant-context category, and resulting RPL pathway in the immutable demo configuration. Do not claim the 70% gate in the pitch unless the selected QP is actually Level 1–3.5. If the selected demo QP is Level 4–6 without formal education, implement RPL-C and use its official assessment composition; RPL-B/RPL-D remain policy configuration stubs unless their required applicant context is present.

For Level 1–3.5, the candidate must demonstrate practical skills in a supervised physical assessment setting; the hackathon RPL-A demo is physical-mode only. Do not design a remote practical flow unless the selected official qualification/process explicitly permits it. For the cited Stage 3 process, all candidates undergo 12–15 hours of orientation. For Level 4–6, the Gazette specifies pathway-dependent composition: RPL-B uses theory 30–50%, practical 50–70% and viva 0–10%; RPL-C uses practical 80–100%, viva 0–20%, with theory optional at 0–10%. The selected QP’s own assessment scheme remains authoritative.

| **Pathway** | **Applicability shown in official flow**           | **System behavior**                                                                                                                                                                                                                                                             |
|-------------|----------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| RPL-A       | NCrF/NSQF Level 1–3.5                              | Pre-screening/mapping; if assessor-confirmed experiential-learning coverage meets the configured threshold, route to direct assessment; if below, route to upskilling. Demo default: \>=70%, pending policy-owner confirmation because the Gazette also contains \>70% wording. |
| RPL-B       | Level 4–6, 12th with experience / UG / PG pursuing | Self-enrolment + verification → orientation → self-assessment for level determination → assessment; no Level 1–3.5 70% gate is applied.                                                                                                                                         |
| RPL-C       | Level 4–6, without formal education                | Enrolment → orientation → specialized RPL assessor/master assessor → practical-skills assessment; no Level 1–3.5 70% gate is applied.                                                                                                                                           |
| RPL-D       | Level 6.5–8                                        | Pre-screening/applicant profile evaluation → technical committee review → certification/feedback path as applicable; no Level 1–3.5 70% gate is applied.                                                                                                                        |

| 70% rule correction / The application MUST NOT implement “70%” as a global RPL rule. It is a pathway-specific policy value for the Level 1–3.5 flow. The NCVET Gazette Stage 3 table states “equal or more than 70%”; Annexure-1 Flowchart 1 and §6.2(c) use “\>70% / more than 70%”. Therefore AssessmentPolicy stores thresholdValue=70 and thresholdOperator as a versioned policy field. The hackathon demo defaults to \>=70% to follow the Stage 3 table, visibly labels the operator as policy-configurable, and must not present the operator as settled NCVET policy without confirmation. Source: NCVET RPL Gazette, Stage 3 Assessment table, PDF p.39; Annexure-1 Flowchart 1, PDF p.51; §6.2(c), PDF p.44. |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

# 4. Source of Truth and Versioning

| **Fact**                    | **Authority**                         | **Stored as**          | **AI mutable?**                        |
|-----------------------------|---------------------------------------|------------------------|----------------------------------------|
| Qualification title/code    | Official QP repository                | QualificationVersion   | No                                     |
| NSQF level                  | Official qualification record         | QualificationVersion   | No                                     |
| NOS                         | Official qualification record         | NOS                    | No                                     |
| Performance criteria        | Official QP/NOS                       | Criterion              | No                                     |
| Assessment marks/components | Qualification assessment strategy     | AssessmentScheme       | No                                     |
| RPL pathway                 | Applicable official RPL policy        | AssessmentPolicy       | No                                     |
| AI observation              | Model output                          | AIObservation          | AI can generate; assessor controls use |
| Final score                 | Persisted assessor decisions + scheme | ScoreSnapshot          | No automatic AI overwrite              |
| Recommendation              | Policy engine + assessor review       | RecommendationSnapshot | No autonomous certification            |

Every assessment freezes the qualification version, assessment scheme, assessment policy, and model/prompt references used during the assessment.

# 5. Qualification Ingestion

1.  Identify the exact official qualification and source document/page.

2.  Persist source URI, retrieval date, source checksum and source type.

3.  Extract qualification metadata, NSQF level, NOS list, criteria and assessment scheme.

4.  Store the normalized data while preserving source references.

5.  Validate required fields and reject incomplete qualification versions.

6.  Create a versioned QualificationVersion.

7.  Require a second-person verification of the demo-critical NOS/criteria before using them in the study.

QualificationVersion {

id

externalCode

title

nsqfLevel

status

version

sourceUri

sourceChecksum

retrievedAt

verificationStatus

}

# 6. Qualification Adapter

The trade is data, not a backend branch.

QualificationAdapter {

qualificationVersion

nsqfLevel

pathwayPolicy

nos\[\]

criteria\[\]

assessmentScheme

taskDefinitions\[\]

evidenceRequirements\[\]

localization\[\]

}

- Switching to another trade should change qualification/task/rubric configuration, not the core workflow.

- A Level 1–3.5 target can use RPL-A and its direct-RPL mapping threshold.

- A Level 4–6 target switches to RPL-B or RPL-C based on applicant context instead of incorrectly using the RPL-A threshold.

- A Level 6.5–8 target can be represented through RPL-D rather than forcing a lower-level workflow.

# 7. Domain Model

Qualification

-\> QualificationVersion

-\> NOS

-\> Criterion

-\> AssessmentScheme

-\> AssessmentPolicy

Candidate

-\> ExperienceProfile

-\> ExperienceStatement

-\> Language

-\> WorkContext

Assessment

-\> RPLPathway

-\> AssessmentSession

-\> AssessmentTask

-\> Evidence

-\> EvidenceTrace

-\> Criterion

-\> AIObservation

-\> CriterionAssessment

-\> ScoreSnapshot

-\> CompetencyProfile

-\> RecommendationSnapshot

-\> AssessorDecision

Governance

-\> ModelRun

-\> AuditEvent

-\> SyncEvent

-\> EvaluationRun

-\> Site

# 8. Core Entities

| **Entity**             | **Key fields**                                                                        |
|------------------------|---------------------------------------------------------------------------------------|
| QualificationVersion   | code, title, NSQF level, version, source URI/checksum, status                         |
| NOS                    | code, title, description, qualificationVersionId                                      |
| Criterion              | code, text, mandatory, component marks, nosId                                         |
| AssessmentScheme       | theory/practical/project/viva/etc., maximum marks, qualifying rule                    |
| AssessmentPolicy       | RPL pathway, threshold where applicable, sourceRef, version                           |
| Candidate              | id, language, consent, minimal identity/profile                                       |
| ExperienceStatement    | raw text, language, normalized skills, source                                         |
| Assessment             | candidate, qualificationVersion, policyVersion, schemeVersion, assessor, site, status |
| AssessmentSession      | session code, device, started/ended, time-sync metadata                               |
| Evidence               | artifact, hash, type, task, session, capturedAt, sync state, version                  |
| EvidenceTrace          | evidenceId, criterionId, relation, creator                                            |
| AIObservation          | claim, evidence ref, criterion, confidence, timestamps, modelRun                      |
| CriterionAssessment    | criterionId, assessor marks/status, note, decision                                    |
| CompetencyProfile      | mapped/demonstrated/assessed coverage + NOS/criterion status                          |
| RecommendationSnapshot | pathway result, gaps, next action, policy version                                     |
| AssessorDecision       | decision, rationale, sign-off time, authorization evidence                            |
| Site                   | siteId, location label, equipment/environment profile                                 |
| AuditEvent             | actor, event, before/after hash, timestamp                                            |
| SyncEvent              | device, eventId, baseVersion, payload hash, server version                            |

# 9. Three Coverage Measures

A major ambiguity is eliminated by using three distinct measures.

| **Metric**                   | **Definition**                                                                                                                                      | **When used**                           |
|------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------|
| Mapped experiential coverage | Qualification learning outcomes supported by the pre-assessment experience mapping / total applicable learning outcomes                             | RPL pathway selection where applicable  |
| Assessed coverage            | Applicable learning outcomes/criteria for which an explicit assessment decision exists / total applicable learning outcomes/criteria                | Assessment completeness                 |
| Demonstrated coverage        | Applicable learning outcomes accepted as demonstrated based on assessor-approved evidence/assessment decisions / total applicable learning outcomes | Competency profile and outcome analysis |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Do not collapse these<br />
</strong>A candidate can have high mapped experiential coverage but low demonstrated coverage. That is exactly why mapping and assessment must remain separate stages.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 10. Recommendation Decision Engine

The decision engine is pure, deterministic and unit-testable. AI may propose mapping evidence, but no pathway outcome is applied until the assessor confirms or edits the mapped experiential coverage. The worker-facing review shows which qualification learning outcomes were counted and the supporting statements/evidence.

INPUTS:

workflowState

recommendationOutcome

pathway

aiProposedMappedExperientialCoverage

assessorConfirmedMappedExperientialCoverage

coverageThresholdValue + coverageThresholdOperator (where applicable)

assessmentComplete + assessedCoverage + demonstratedCoverage

qualificationMinimumRule + mandatoryCriteriaStatus + unresolvedEvidence

assessorDecision (ACCEPT_RECOMMENDATION \| PATHWAY_ROUTING_OVERRIDE \| RECOMMENDATION_OVERRIDE_DOWNGRADE \| SECOND_REVIEW_REQUEST)

RULES — evaluation order (authoritative; higher rows always win):

1\. Determine the RPL pathway from qualification NSQF level plus applicant education/enrolment context. Missing required context blocks pathway routing: workflowState = PATHWAY_CONFIRMATION_PENDING and recommendationOutcome = PATHWAY_CONFIRMATION_REQUIRED.

2\. If the selected pathway has a mapping threshold and assessorConfirmedMappedExperientialCoverage is null, recommendationOutcome = PATHWAY_CONFIRMATION_REQUIRED. AI-proposed coverage alone can never route a candidate.

3\. If a threshold applies and assessor-confirmed coverage is below that versioned threshold, systemOutcome = UPSKILLING_REQUIRED. A PATHWAY_ROUTING_OVERRIDE may move only to direct assessment when policy permits, requires a rationale, and is quality-sampled.

4\. If required assessment components are not all complete, systemOutcome = ASSESSMENT_REQUIRED and workflowState = ASSESSMENT_IN_PROGRESS.

5\. If assessment components are complete but required evidence is missing, systemOutcome = ASSESSMENT_INCOMPLETE. Evidence incompleteness takes precedence over outcome evaluation.

6\. If any mandatory criterion is unresolved, systemOutcome = ASSESSMENT_REVIEW_REQUIRED and workflowState = CRITERION_RESOLUTION_REQUIRED. Unresolved takes precedence over a simultaneous failed mandatory criterion until resolution.

7\. If a mandatory criterion is failed, systemOutcome = NOT_SUITABLE_FOR_SIGNOFF unless the official qualification policy explicitly defines remediation/reassessment handling.

8\. If the qualification-specific minimum pass rule is not met, systemOutcome = NOT_SUITABLE_FOR_SIGNOFF.

9\. If every configured assessment component, evidence requirement, criterion and minimum-pass rule is satisfied, systemOutcome = SUITABLE_FOR_SIGNOFF and workflowState = SIGNOFF_READY.

10\. Assessor decision is separate from the system outcome. ACCEPT_RECOMMENDATION accepts the system result; PATHWAY_ROUTING_OVERRIDE may only change threshold routing under rule 3; RECOMMENDATION_OVERRIDE_DOWNGRADE may only move a suitable result to a non-positive disposition. An attempted upward override of a mandatory failure or official minimum-pass failure is not permitted; the assessor may instead request the configured second-review/moderation route.

11\. Authorized server-side finalization is required before any positive sign-off or negative/referral report becomes final. AI never certifies, signs off, or silently changes authoritative marks.

TIE-BREAKS: missing required evidence \> unresolved mandatory criterion \> mandatory failure \> minimum-pass failure \> suitable-for-signoff. A rule must resolve every terminal decision; any transition not listed in the Section 26 transition table is invalid. When a lower-priority condition coexists with a higher-priority unresolved condition, the higher-priority condition controls.

FINAL DISPOSITION ENUM (populated only when the assessor completes the final decision): UPSKILLING_REFERRAL \| SUITABLE_FOR_SIGNOFF \| NOT_RECOMMENDED \| REASSESSMENT_REQUIRED

## 10.1 Recommendation decision table

| **Condition**                                                          | **System outcome**                              | **Workflow state**                                                    | **Assessor action / final disposition**                                                                                                                                                                                                                        |
|------------------------------------------------------------------------|-------------------------------------------------|-----------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Threshold applies + assessor-confirmed coverage below threshold        | UPSKILLING_REQUIRED                             | PATHWAY_SELECTED or ASSESSOR_DECISION_PENDING                         | ACCEPT_RECOMMENDATION -\> finalDisposition=UPSKILLING_REFERRAL; PATHWAY_ROUTING_OVERRIDE -\> change only to direct-assessment pathway when policy permits, with rationale + quality flag; finalDisposition remains unset until the eventual assessor decision. |
| Threshold applies + AI proposal below threshold + coverage unconfirmed | PATHWAY_CONFIRMATION_REQUIRED                   | PATHWAY_CONFIRMATION_PENDING                                          | CONFIRM_COVERAGE / EDIT_COVERAGE; no route until assessor confirms counted outcomes.                                                                                                                                                                           |
| No 70% threshold (RPL-B/C/D)                                           | ASSESSMENT_REQUIRED                             | PATHWAY_SELECTED                                                      | Continue under pathway-specific policy and official assessment scheme; 70% gate is skipped.                                                                                                                                                                    |
| Mapping complete; assessment incomplete                                | ASSESSMENT_REQUIRED                             | ASSESSMENT_IN_PROGRESS                                                | Continue assessment; no finalization.                                                                                                                                                                                                                          |
| Required evidence missing                                              | ASSESSMENT_INCOMPLETE                           | ASSESSMENT_IN_PROGRESS                                                | Collect/request evidence; no finalization.                                                                                                                                                                                                                     |
| Mandatory criterion unresolved                                         | ASSESSMENT_REVIEW_REQUIRED                      | CRITERION_RESOLUTION_REQUIRED                                         | Resolve criterion; may return to ASSESSMENT_IN_PROGRESS; no direct sign-off override.                                                                                                                                                                          |
| Mandatory criterion failed                                             | NOT_SUITABLE_FOR_SIGNOFF                        | REMEDIATION_REQUIRED                                                  | ACCEPT/FINALIZE referral or follow official remediation/reassessment policy; no upward override to sign-off.                                                                                                                                                   |
| Minimum qualification pass rule not met                                | NOT_SUITABLE_FOR_SIGNOFF                        | REMEDIATION_REQUIRED                                                  | ACCEPT/FINALIZE referral or follow official remediation/reassessment policy; no upward override to sign-off.                                                                                                                                                   |
| All configured requirements met                                        | SUITABLE_FOR_SIGNOFF                            | SIGNOFF_READY                                                         | ACCEPT_RECOMMENDATION -\> SUITABLE_FOR_SIGNOFF; permitted downgrade -\> RECOMMENDATION_OVERRIDE_DOWNGRADE + rationale.                                                                                                                                         |
| Assessor requests more evidence before final decision                  | Depends on current system outcome               | SIGNOFF_READY or ASSESSOR_DECISION_PENDING -\> ASSESSMENT_IN_PROGRESS | Downgrade/reopen is recorded; any score change triggers deterministic server recomputation.                                                                                                                                                                    |
| Negative/referral outcome accepted by assessor                         | UPSKILLING_REQUIRED or NOT_SUITABLE_FOR_SIGNOFF | FINAL_REPORT_READY                                                    | Finalize an assessment report/referral; finalDisposition = UPSKILLING_REFERRAL or NOT_RECOMMENDED/REASSESSMENT_REQUIRED; then lock.                                                                                                                            |
| Positive outcome accepted and authorized                               | SUITABLE_FOR_SIGNOFF                            | SIGNED_OFF -\> LOCKED                                                 | Write certification recommendation package, competency profile and immutable audit record.                                                                                                                                                                     |

## 10.2 Recommendation Engine Unit-Test Table

These are executable acceptance tests for the pure decision function. Workflow state, system outcome, assessor decision and final disposition are stored separately.

| **Test** | **Input / condition**                                                         | **Expected**                                                                                                                  |
|----------|-------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| T01      | Threshold applies; AI coverage below threshold; assessor coverage null        | workflow=PATHWAY_CONFIRMATION_PENDING; system=PATHWAY_CONFIRMATION_REQUIRED; no route                                         |
| T02      | Threshold applies; assessor confirms below threshold                          | workflow=PATHWAY_SELECTED; system=UPSKILLING_REQUIRED; finalDisposition remains unset until assessor decision                 |
| T03      | Below threshold after confirmation; assessor invokes PATHWAY_ROUTING_OVERRIDE | Pathway changes to direct assessment only; rationale + quality flag; system outcome remains auditable                         |
| T04      | RPL-B/C/D; coverage below 70%                                                 | 70% gate does not run; use pathway-specific policy/scheme                                                                     |
| T05      | Exactly 70%; operator \>=                                                     | threshold passes                                                                                                              |
| T06      | Exactly 70%; operator \>                                                      | threshold does not pass; boundary is explicit and policy version is retained                                                  |
| T07      | AI proposes 55%; assessor edits to 75%; operator \>=                          | 75% assessor-confirmed coverage is authoritative; counted outcomes are visible                                                |
| T08      | Assessment components incomplete                                              | system=ASSESSMENT_REQUIRED; workflow=ASSESSMENT_IN_PROGRESS                                                                   |
| T09      | Missing required evidence + mandatory failure                                 | system=ASSESSMENT_INCOMPLETE                                                                                                  |
| T10      | Unresolved mandatory + failed mandatory                                       | system=ASSESSMENT_REVIEW_REQUIRED; workflow=CRITERION_RESOLUTION_REQUIRED                                                     |
| T11      | Complete evidence + mandatory failure                                         | system=NOT_SUITABLE_FOR_SIGNOFF; workflow=REMEDIATION_REQUIRED                                                                |
| T12      | Minimum pass failed; no unresolved criteria                                   | system=NOT_SUITABLE_FOR_SIGNOFF; workflow=REMEDIATION_REQUIRED                                                                |
| T13      | All requirements satisfied                                                    | system=SUITABLE_FOR_SIGNOFF; workflow=SIGNOFF_READY                                                                           |
| T14      | Suitable result; assessor wants more evidence                                 | reopen to ASSESSMENT_IN_PROGRESS; no final disposition; new evidence/marks recomputed server-side                             |
| T15      | Mandatory/min-pass failure; assessor attempts upward override                 | reject; record SECOND_REVIEW_REQUEST if the qualification permits moderation; never sign off by assessor override alone       |
| T16      | Offline/unsynced or unauthorized sign-off/finalization                        | reject transaction; never enter SIGNED_OFF, FINAL_REPORT_READY finalization, REPORT_FINALIZED_NOT_RECOMMENDED, or LOCKED      |
| T17      | Education/enrolment context missing for pathway selection                     | workflow=PATHWAY_CONFIRMATION_PENDING; system=PATHWAY_CONFIRMATION_REQUIRED; no final disposition                             |
| T18      | Assessor accepts negative/referral recommendation                             | workflow=FINAL_REPORT_READY -\> REPORT_FINALIZED_NOT_RECOMMENDED -\> LOCKED; report contains referral/remediation disposition |
| T19      | All suitable requirements met; assessor accepts and signs                     | workflow=SIGNOFF_READY -\> ASSESSOR_DECISION_PENDING -\> SIGNED_OFF -\> LOCKED; finalDisposition=SUITABLE_FOR_SIGNOFF         |
| T20      | Location or required proctoring missing where policy makes it mandatory       | server finalization blocked or routed to review; missing evidence is not silently verified                                    |
| T21      | RPL-A exactly at configured threshold with \>= operator                       | direct assessment route is eligible after assessor confirmation; no AI-only routing                                           |
| T22      | Client preview differs from server recomputation                              | server result wins; preview is non-authoritative and discrepancy is logged                                                    |

These internal states are not substitutes for official certification outcomes. The wording used in any certificate/report must be derived from the authorized qualification/assessment process.

# 11. Official Assessment-Scheme Fidelity

NCVET assessment-criteria templates can specify marks by assessment component such as theory, practical, project and viva, and can use aggregate qualification-level or component/NOS-wise minimum qualifying rules. The canonical model therefore preserves the selected qualification’s actual assessment scheme rather than imposing a universal 0–3 scale.

| **Assessment component** | **Canonical representation**                         |
|--------------------------|------------------------------------------------------|
| Theory                   | maxMarks, awardedMarks, questions/evidence refs      |
| Practical                | maxMarks, awardedMarks, observation/evidence refs    |
| Project                  | maxMarks, awardedMarks, project evidence             |
| Viva                     | maxMarks, awardedMarks, question/response references |
| Other                    | Configurable component defined by QP                 |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Auxiliary status indicators<br />
</strong>For UX and AI assistance, the UI may use “Not demonstrated / Partial / Meets anchor” as explanatory labels, but these are not the authoritative scoring scheme unless the selected QP explicitly uses them. Final marks come from the official/configured assessment scheme.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 12. Rubric Architecture

OfficialAssessmentScheme

\|

+-- AssessmentComponent

\| +-- maxMarks

\| +-- qualifyingRule

\|

+-- CriterionMarkAllocation

\| +-- criterionId

\| +-- theoryMarks

\| +-- practicalMarks

\| +-- projectMarks

\| +-- vivaMarks

\|

+-- ScoringRule

+-- aggregate OR NOS/component-wise

- Do not invent the official passing percentage. Do not invent criterion weights when the QP already specifies marks. The demo must either (a) select a qualification whose full configured scheme can be captured end-to-end, or (b) explicitly label the demo result as a partial practical-component result and disable the final qualification pass/recommendation calculation. For this submission, the preferred demo path is (a): include the selected QP’s required theory/viva components in the demo fixture rather than claiming a final result from practical evidence alone.

- 

- If the AI contract is given an official component scale and maximum marks, it may suggest a mark on that exact scale. Otherwise it must suggest an anchor/status only and leave mark assignment to the assessor. Any simplified UX anchor is non-authoritative and expert-reviewed.

- The official/configured marks remain the source of truth.

- Internal normalization to 0–100 is allowed for analytics only.

# 13. NSQF Competency Profile

Qualification

Code: \<official\>

Version: \<version\>

NSQF Level: \<official\>

RPL Pathway: \<policy-selected\>

Mapped experiential coverage: XX%

Assessed coverage: XX%

Demonstrated coverage: XX%

NOS-01

Criterion C01: Demonstrated

Criterion C02: Partial / additional evidence

Criterion C03: Not demonstrated

Assessment score:

Practical: xx / yy

Theory: xx / yy

Viva: xx / yy

Mandatory criteria:

4 / 4 satisfied

Recommendation:

\<policy-derived outcome\>

FOR ASSESSOR SIGN-OFF

# 14. Experience Capture

| **Field**                           | **Input method**                            | **Stored**                                   |
|-------------------------------------|---------------------------------------------|----------------------------------------------|
| Occupation/work role                | Text + guided choices + voice               | Original + normalized                        |
| Years of experience                 | Numeric/guided                              | Raw value                                    |
| Tasks performed                     | Multi-select + free text + voice            | Raw + normalized skill tags                  |
| Tools used                          | Multi-select + voice                        | Raw + normalized concepts                    |
| Materials                           | Guided/free text                            | Normalized concepts                          |
| Outputs                             | Free text/photos                            | Original + normalized concepts               |
| Work context                        | Guided questions                            | Structured                                   |
| Prior credentials/evidence          | Document/photo                              | Evidence metadata                            |
| Language                            | Detected + explicit confirmation            | Original language                            |
| Highest formal education            | Guided choice + optional evidence           | Structured value + verification status       |
| Current education/enrolment context | Guided choice                               | UG/PG pursuing, not pursuing, other + source |
| Formal education evidence           | Document/photo where applicable             | Evidence metadata                            |
| Applicant context for RPL pathway   | Derived by policy engine after verification | PathwayContextSnapshot                       |

Every practical assessment session is supervised/proctored and supported by digital and video evidence with geotagging, consistent with the NCVET RPL governance table for the relevant RPL flows. Offline capture is allowed, but authoritative acceptance of evidence is decided at server-side sign-off.

Evidence capture fields:

captureId, evidenceId, sessionId, assessmentId, candidateId, assessorId, siteId

capturedAtClient, capturedAtServer, clientTimezone, clockSkewSeconds

latitude, longitude, locationAccuracyMeters, locationCapturedAt, locationStatus (AVAILABLE \| UNAVAILABLE \| PERMISSION_DENIED)

taskCode, evidenceType (VIDEO \| IMAGE \| DOCUMENT \| NOTE), durationSeconds, sha256, deviceId, evidenceVersion

proctoringStatus (VERIFIED \| FLAGGED \| UNAVAILABLE), proctoringAttestedBy, proctoringAttestedAt, mockLocationFlag, geolocationIntegrityFlag

- Offline GPS capture is best-effort; LOCATION_UNAVAILABLE or PERMISSION_DENIED is recorded explicitly and never converted to “verified”. The assessor attests proctoringStatus at session close in the demo; any later verifier role may update it only through an auditable correction workflow. Geolocation-integrity and mock-location flags are produced by available client/server checks and are advisory unless the qualification/policy says otherwise.

- Where the device/platform supports it, mock-location/fake-GPS signals are checked and stored as review flags; these checks are advisory rather than proof of authenticity.

- If the selected qualification/policy requires geotagged evidence, missing location/proctoring requirements block or route the case for review according to that policy.

- Location is personal data for this system; apply purpose limitation, access control, retention rules and lawful-basis/consent requirements appropriate to deployment.

Pathway-selection fields captured before mapping/assessment:

highestFormalEducation (NONE \| PRIMARY \| 5TH \| 8TH \| 10TH \| 12TH \| ITI \| DIPLOMA \| UG \| PG \| OTHER)

educationEvidenceRefs\[\]

currentEnrolment (NONE \| UG_PURSUING \| PG_PURSUING \| OTHER)

educationContextVerified (true \| false)

applicantContextSource (SELF_DECLARED \| DOCUMENT_VERIFIED \| ORGANIZER_DATA)

# 15. Multilingual Mapping

Original language statement

\|

language detection

\|

+------------------------+

\| preserve original \|

\| optional translation \|

+------------------------+

\|

multilingual embedding

\|

hybrid retrieval

\|

QP text may remain English

\|

cross-language semantic match

\|

reranker

| **Language metric**    | **Measure**                                            |
|------------------------|--------------------------------------------------------|
| STT quality            | Word/character error where reference transcript exists |
| Mapping top-1          | Correct QP at rank 1 by language                       |
| Mapping top-3          | Correct QP within 3 by language                        |
| Evidence linkage       | Correct criterion links by language                    |
| Unsupported claim rate | AI claims not supported by evidence by language        |

# 16. Qualification Mapping UX

Candidate statement:

"I have stitched garments for seven years..."

Top candidates:

1\. Official Target QP

NSQF Level: X

Relevance: 0.87

Matched:

\- machine operation

\- garment assembly

\- alteration

Sources:

\- experience statements

\- QP/NOS references

2\. Distractor QP B

NSQF Level: Y

Relevance: 0.71

3\. Distractor QP C

NSQF Level: Z

Relevance: 0.58

\[Confirm mapping\] \[Not my work\]

The relevance number is a ranking score, not probability of certification or competence.

# 17. Mapping Evaluation Pool

The live demo may show a 4-QP comparison, but the evaluation dataset must be larger so Top-3 recall is not structurally close to 100%.

| **Evaluation component**         | **Target**                                                        |
|----------------------------------|-------------------------------------------------------------------|
| Qualifications in retrieval pool | 10–15 from same/adjacent sectors                                  |
| Target qualification             | Known expert label                                                |
| Worker profiles                  | 30–50 pilot cases if resources permit                             |
| Top-1 metric                     | Correct target at rank 1                                          |
| Top-3 metric                     | Correct target among first 3                                      |
| Error analysis                   | Trade overlap, sparse statements, language, ambiguous roles       |
| Source quality                   | All candidates traceable to official/validated repository records |

# 18. Organizer Dummy-Data Import

The organizer-provided dummy worker-assessment dataset must be treated as an input pipeline, not as a late-stage manual copy/paste task.

POST /api/imports/worker-assessments

or

pnpm import:worker-data --file data/imports/worker_assessments.csv

Required logical fields:

candidate_id

occupation

language

years_experience

experience_text

declared_tasks

declared_tools

declared_outputs

prior_evidence_refs

qualification_label? \# evaluation only

criterion_labels? \# evaluation only

assessor_id? \# evaluation only

site_id? \# evaluation only

condition? \# evaluation only

| **Import stage**       | **Output**                                 |
|------------------------|--------------------------------------------|
| Schema validation      | Valid/invalid row report                   |
| Normalization          | Skill/task/tool normalized fields          |
| Deduplication          | Duplicate candidate/evidence report        |
| Privacy transformation | Demo-safe identifiers where required       |
| Evaluation labeling    | Gold labels kept separate from model input |
| Load                   | Domain records + provenance                |

# 19. Practical Assessment Task Model

TaskDefinition {

taskCode

title

candidateInstructions\[\]

assessorInstructions\[\]

safetyNotes\[\]

conditions\[\]

equipment\[\]

expectedObservableActions\[\]

evidenceRequirements\[\]

linkedCriteria\[\]

captureTypes\[\]

}

| **Task**                   | **Primary evidence**            | **Assessment use**              |
|----------------------------|---------------------------------|---------------------------------|
| T1 Preparation/measurement | Photo + checklist + observation | Preparation/tool-use            |
| T2 Setup/safe operation    | Short video + checklist         | Procedure/safety                |
| T3 Core production         | Video + final output            | Core practical performance      |
| T4 Finishing/inspection    | Photos + assessor note          | Quality                         |
| T5 Repair/problem solving  | Before/after + explanation      | Troubleshooting when applicable |

# 20. Evidence Traceability Graph

Qualification

\|

v

NOS

\|

v

Criterion C07

^

\|

EvidenceTrace

^

\|

AIObservation -------- AssessorObservation

^ ^

\| \|

Video EV-103 Assessor Note

\|

Task T2

\|

Assessment Session S01

\|

Candidate + Assessor + Site

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Why this matters<br />
</strong>A final score must be traceable backwards: score -&gt; criterion -&gt; evidence -&gt; task/session -&gt; candidate. Mapping decisions must similarly trace to worker statements and official qualification source records.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 21. Evidence Authenticity

| **Control**       | **Demo behavior**                                   | **Production extension**                         |
|-------------------|-----------------------------------------------------|--------------------------------------------------|
| Session ID        | Every practical task belongs to an active session   | Device-managed session token                     |
| Task code         | Candidate/assessor states short code before capture | Stronger controlled task initiation              |
| Assessor presence | Assessor starts task and reviews evidence           | Authorized assessor identity integration         |
| Timestamp         | Client capture time + server sync time              | Trusted device clock/attestation where justified |
| Artifact hash     | SHA-256                                             | Immutable storage and retention                  |
| Version           | Corrections create new evidence version             | Full evidence chain                              |

# 22. AI Evidence Assistant

| **AI function**       | **Input**                            | **Output**               | **Decision owner**     |
|-----------------------|--------------------------------------|--------------------------|------------------------|
| Transcription         | Audio/video                          | Transcript + timestamps  | Assessor               |
| Observable extraction | Photo/video/text                     | Evidence-grounded claims | Assessor               |
| Criterion linking     | Observation + criterion              | Candidate links          | Assessor               |
| Missing evidence      | Criterion + evidence set             | Not-established flags    | Assessor               |
| Score suggestion      | Approved observation + source rubric | Suggested mark/anchor    | Assessor               |
| Summary               | Approved observations/scores         | Report text              | Assessor/system policy |

# 23. Evidence AI Contract

{

"criterionId": "CR-07",

"evidenceRefs": \[

{

"evidenceId": "EV-103",

"timestampStart": 21.4,

"timestampEnd": 27.1

}

\],

"observation": "Candidate aligns the two material edges before stitching.",

"confidence": 0.82,

suggestedAssessment: "MEETS_CRITERION"

suggestedMark: null // populated only when the official component scale/maxMarks is supplied to the model

suggestedMarkBasis: "OFFICIAL_ASSESSMENT_SCHEME"

AI mark contract: when the official component scale/maxMarks is supplied, numeric suggestions use that exact scale. Otherwise return criterion evidence/anchor only and suggestedMark = null.

rationale: "Observed evidence corresponds to the configured criterion and cited evidence refs."

}

- No evidence reference = invalid observation.

- No criterion ID = invalid observation.

- Free-form final score is never accepted as authoritative.

- Invalid model output is retried or marked failed; it is not silently coerced.

# 24. AI Model Governance

| **Artifact**         | **Versioned** | **Persist**            |
|----------------------|---------------|------------------------|
| AI model             | Yes           | modelName/modelVersion |
| Prompt/template      | Yes           | promptVersion          |
| Qualification source | Yes           | source IDs/checksum    |
| Assessment scheme    | Yes           | schemeVersion          |
| Assessment policy    | Yes           | policyVersion          |
| Retrieved passages   | Yes           | source IDs             |
| Input                | Hash          | inputHash              |
| Output               | Hash          | outputHash             |

# 25. Scoring Engine

authoritativeCriterionMark = assessorApprovedMark

assessmentComponentTotal =

SUM(authoritativeCriterionMark by component)

finalQualificationScore =

APPLY(qualification.assessmentScheme, componentTotals)

minimumPassStatus =

APPLY(qualification.assessmentScheme.qualifyingRule, finalQualificationScore)

recommendation =

APPLY(assessmentPolicy, pathway, coverage, mandatoryStatus,

minimumPassStatus, evidenceCompleteness)

The scoring engine should be pure application code with deterministic tests. AI only supplies optional suggestions.

# 26. Recommendation State Machine

WORKFLOW STATE ENUM (authoritative): MAPPING_PENDING \| PATHWAY_CONFIRMATION_PENDING \| PATHWAY_SELECTED \| ASSESSMENT_READY \| ASSESSMENT_IN_PROGRESS \| CRITERION_RESOLUTION_REQUIRED \| REMEDIATION_REQUIRED \| SIGNOFF_READY \| ASSESSOR_DECISION_PENDING \| FINAL_REPORT_READY \| SIGNED_OFF \| REPORT_FINALIZED_NOT_RECOMMENDED \| LOCKED

RECOMMENDATION OUTCOME ENUM: PATHWAY_CONFIRMATION_REQUIRED \| UPSKILLING_REQUIRED \| ASSESSMENT_REQUIRED \| ASSESSMENT_INCOMPLETE \| ASSESSMENT_REVIEW_REQUIRED \| NOT_SUITABLE_FOR_SIGNOFF \| SUITABLE_FOR_SIGNOFF

ASSESSOR DECISION ENUM: ACCEPT_RECOMMENDATION \| PATHWAY_ROUTING_OVERRIDE \| RECOMMENDATION_OVERRIDE_DOWNGRADE \| SECOND_REVIEW_REQUEST

FINAL DISPOSITION ENUM: UPSKILLING_REFERRAL \| SUITABLE_FOR_SIGNOFF \| NOT_RECOMMENDED \| REASSESSMENT_REQUIRED. It is populated only after the assessor completes a terminal decision; pathway routing and second-review requests are not final dispositions.

State-machine rule: positive qualification outcomes finalize through SIGNED_OFF; negative/referral outcomes finalize through REPORT_FINALIZED_NOT_RECOMMENDED. A later reassessment starts a new assessment attempt/version rather than mutating a locked record.

| **From state**                   | **Guard / trigger**                                                                          | **To state**                     | **Authoritative action**                                                                                       |
|----------------------------------|----------------------------------------------------------------------------------------------|----------------------------------|----------------------------------------------------------------------------------------------------------------|
| MAPPING_PENDING                  | Qualification match + required applicant context complete; no pending threshold confirmation | PATHWAY_SELECTED                 | Persist selected QP/version, pathway and evidence of context.                                                  |
| MAPPING_PENDING                  | Threshold pathway selected + assessor-confirmed mapped coverage is null                      | PATHWAY_CONFIRMATION_PENDING     | Block pathway routing; recommendationOutcome=PATHWAY_CONFIRMATION_REQUIRED; AI proposal alone cannot route.    |
| MAPPING_PENDING                  | Required education/enrolment context missing                                                 | PATHWAY_CONFIRMATION_PENDING     | Block pathway routing; recommendationOutcome=PATHWAY_CONFIRMATION_REQUIRED.                                    |
| PATHWAY_CONFIRMATION_PENDING     | Assessor confirms or edits pathway inputs/coverage                                           | PATHWAY_SELECTED                 | Persist assessor-confirmed coverage/context; apply versioned policy.                                           |
| PATHWAY_SELECTED                 | Selected pathway requires direct assessment                                                  | ASSESSMENT_READY                 | Freeze qualification, scheme and policy snapshots.                                                             |
| PATHWAY_SELECTED                 | System outcome=UPSKILLING_REQUIRED and assessor accepts                                      | ASSESSOR_DECISION_PENDING        | Prepare referral/report; finalDisposition remains unset until the assessor finalizes the referral.             |
| ASSESSMENT_READY                 | Assessor starts session                                                                      | ASSESSMENT_IN_PROGRESS           | Begin supervised/proctored assessment attempt.                                                                 |
| ASSESSMENT_IN_PROGRESS           | Mandatory criterion unresolved                                                               | CRITERION_RESOLUTION_REQUIRED    | Pause finalization; resolve then return to assessment.                                                         |
| CRITERION_RESOLUTION_REQUIRED    | Criterion resolved and evidence state valid                                                  | ASSESSMENT_IN_PROGRESS           | Resume assessment attempt; recompute authoritative state.                                                      |
| ASSESSMENT_IN_PROGRESS           | All required evidence/criteria complete and pass conditions satisfied                        | SIGNOFF_READY                    | Expose final recommendation to assessor.                                                                       |
| ASSESSMENT_IN_PROGRESS           | Mandatory failure or official minimum-pass failure after evaluation                          | REMEDIATION_REQUIRED             | Prepare official remediation/reassessment referral; no upward override.                                        |
| REMEDIATION_REQUIRED             | Assessor accepts negative/remediation disposition                                            | ASSESSOR_DECISION_PENDING        | finalDisposition=NOT_RECOMMENDED or REASSESSMENT_REQUIRED.                                                     |
| REMEDIATION_REQUIRED             | Official reassessment workflow begins                                                        | ASSESSMENT_READY                 | Start a new assessment attempt/version; retain prior result immutably.                                         |
| SIGNOFF_READY                    | Assessor opens final decision                                                                | ASSESSOR_DECISION_PENDING        | Validate decision authority and evidence before finalization.                                                  |
| SIGNOFF_READY                    | Assessor requests more evidence                                                              | ASSESSMENT_IN_PROGRESS           | Record reopen reason; invalidate prior readiness; recompute after new evidence.                                |
| ASSESSOR_DECISION_PENDING        | Assessor requests more evidence                                                              | ASSESSMENT_IN_PROGRESS           | Same as reopen above; preserve decision audit event.                                                           |
| ASSESSOR_DECISION_PENDING        | Suitable recommendation accepted + authorized online finalization                            | SIGNED_OFF                       | Create signed certification-recommendation package and audit event.                                            |
| ASSESSOR_DECISION_PENDING        | Negative/referral recommendation accepted + authorized online finalization                   | FINAL_REPORT_READY               | Generate assessment report + referral/remediation disposition.                                                 |
| ASSESSOR_DECISION_PENDING        | Assessor attempts prohibited upward override                                                 | ASSESSOR_DECISION_PENDING        | Reject action; record SECOND_REVIEW_REQUEST where policy permits; do not change official pass result.          |
| FINAL_REPORT_READY               | Report validation succeeds + authorized finalization                                         | REPORT_FINALIZED_NOT_RECOMMENDED | Lock negative/referral report data for final record.                                                           |
| SIGNED_OFF                       | Server finalization succeeds                                                                 | LOCKED                           | Terminal positive record; immutable thereafter except versioned amendment.                                     |
| REPORT_FINALIZED_NOT_RECOMMENDED | Server finalization succeeds                                                                 | LOCKED                           | Terminal negative/referral record; immutable thereafter except new attempt/version.                            |
| Any non-terminal state           | Offline, unsynced, expired authorization or failed integrity gate at finalization            | same state                       | Reject finalization; capture may continue according to offline policy, but no terminal final state is entered. |

# 27. Assessor Integrity Controls

- Assessor disagreement is explicit: ACCEPT_RECOMMENDATION, PATHWAY_ROUTING_OVERRIDE where allowed, or RECOMMENDATION_OVERRIDE_DOWNGRADE for a permitted downgrade.

- Every override requires a structured reasonCode plus free-text rationale; systemOutcome, assessorDecision and finalDisposition remain separate and immutable audit inputs.

- The UI shows which outcomes/criteria/evidence produced the recommendation so the assessor can review rather than rubber-stamp.

- Upward overrides cannot bypass mandatory failure or official minimum-pass failure. Those cases require official remediation/reassessment or a second-review mechanism defined by the qualification owner.

| **Control**        | **Behavior**                                                                                 |
|--------------------|----------------------------------------------------------------------------------------------|
| Completeness gate  | Every applicable criterion has an explicit decision before sign-off                          |
| Evidence-open gate | Required evidence must be opened/reviewed before scoring where policy/configuration requires |
| Authorization gate | Assessor credential/scope is valid and assessor is assigned to assessment                    |
| Conflict gate      | Concurrent score changes cannot overwrite silently                                           |
| AI override record | Accept/edit/reject is recorded                                                               |
| Second review      | Configurable random sample or risk-triggered review                                          |
| Sign-off gate      | Final decision requires authorized human action                                              |
| Post-sign lock     | Signed assessment becomes immutable/controlled-amendment only                                |

# 28. Offline Assessment Contract

Offline operation applies to capture and assessment preparation. Final sign-off requires server synchronization because the system must persist the authoritative decision, enforce authorization, recalculate the result and append the audit event.

Offline UX boundary: self-declaration, task observations, evidence, location metadata and provisional previews may be captured offline. Final authoritative scoring, pathway recommendation and sign-off require successful synchronization.

Background sync is optional, not assumed. Reference implementation: foreground resumable/chunked upload with explicit progress and retry; any background-sync behavior shown in the demo must be tested on the actual demo device.

| **State**                    | **Offline allowed?**                                                |
|------------------------------|---------------------------------------------------------------------|
| Self-declaration draft       | Yes                                                                 |
| Assessment task capture      | Yes                                                                 |
| Evidence capture             | Yes                                                                 |
| Assessor provisional scoring | Yes, if locally authorized session                                  |
| AI processing                | Deferred/optional                                                   |
| Final score computation      | Can preview locally; authoritative server recomputation at sign-off |
| Final sign-off               | No — server synchronization required                                |
| Assessment lock              | No — performed with server sign-off transaction                     |

# 29. Offline Authentication, Time and Encryption

## 29.1 Offline authorization

- An assessor must authenticate while online before entering an offline session.

- The server issues a narrowly scoped offline session authorization with expiry and assessment/session scope.

- The device stores only the minimum credential material required to resume the session.

- If offline authorization expires, evidence capture may continue; provisional/local scoring preview stops by default. The device may queue unsent evidence/events, but authoritative recommendation/sign-off remains blocked until the server is reachable. This is the default safe policy.

- PWA browser storage is weaker than a native secure enclave/keystore; this limitation must be documented.

## 29.2 Clock integrity

Evidence:

clientCapturedAt

clientTimezone

serverSyncedAt

clockSkewSeconds

On sync:

clockSkew = serverReceivedAt - clientCapturedAt

if abs(clockSkew) \> configurableThreshold:

flag = CLOCK_DRIFT_REVIEW

Use a configurable demo threshold rather than treating device time as trusted evidence of authenticity. Large drift is a review signal.

## 29.3 Local encryption

- Encrypt sensitive local data at rest when platform capabilities permit.

- For native field apps, use platform secure storage/keystore and encrypted database/media storage.

- For a browser/PWA demo, Web Crypto may protect application-level records, but a key stored beside the encrypted data is not treated as a strong secret. Production native clients must use platform secure storage/keystore. If browser-only encrypted storage is used for the demo, the key must be derived from an assessor-entered PIN/passphrase or another separately protected secret; otherwise document the mechanism as obfuscation rather than a security boundary.

- Scoring and recommendation logic has one canonical implementation in packages/domain. The client uses the same pure functions for a non-authoritative preview; the server reruns the same functions authoritatively at sign-off. Never maintain separate client/server scoring algorithms.

# 30. Offline Media

| **Issue**           | **Reference solution**                                |
|---------------------|-------------------------------------------------------|
| Video size          | Task-specific duration/resolution limits              |
| Compression         | Client-side controlled compression                    |
| Upload interruption | Foreground resumable/chunked upload                   |
| Retry               | Persistent queue with retry/backoff                   |
| Background sync     | Optional only; do not depend on it                    |
| Browser eviction    | Persistent-storage request + visible unsynced warning |
| Storage pressure    | Preflight quota check + sync/shorten/segment          |
| Duplicate upload    | Event ID + artifact hash                              |
| AI latency          | Capture now, analyze asynchronously later             |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Demo-device requirement<br />
</strong>Test the exact offline/reconnect workflow on the phone/tablet used in the presentation. Do not assume service-worker background sync behaves the same across mobile browsers.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 31. Synchronization Protocol

POST /api/sync/batch

{

"eventId": "uuid",

"deviceId": "device-01",

"entityType": "Evidence",

"entityId": "EV-103",

"operation": "CREATE",

"baseVersion": 2,

"clientSequence": 14,

"payload": {...},

"payloadHash": "sha256:...",

"createdAt": "client-time"

}

Server:

1\. authenticate session/device

2\. validate event

3\. deduplicate eventId

4\. verify baseVersion

5\. apply or create conflict

6\. persist server timestamp

7\. append audit event

8\. return serverVersion

# 32. Conflict Rules

| **Entity**                  | **Conflict behavior**                                    |
|-----------------------------|----------------------------------------------------------|
| Draft experience text       | Field-level merge where safe                             |
| Evidence                    | Versioned, no overwrite                                  |
| Criterion score             | Explicit human conflict                                  |
| Recommendation              | Recomputed from current authoritative assessment state   |
| Sign-off                    | No merge after signing                                   |
| Qualification/rubric/policy | Server-authoritative, assessment snapshot remains frozen |

# 33. Evaluation Resource Plan

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Resource gate<br />
</strong>The consistency study is a gated deliverable. The team must secure qualified assessors and an expert adjudicator before claiming an improvement result.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

| **Resource**             | **Target**                                                                                                                | **Deadline**                      | **Fallback**                                                                                                                               |
|--------------------------|---------------------------------------------------------------------------------------------------------------------------|-----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| Assessors                | 4 independent assessors                                                                                                   | Day 3                             | If 4 cannot be secured, run only an internal/pilot evaluation and disable the primary assessor-consistency claim.                          |
| Expert adjudicator       | 1 domain expert, preferably independent of scoring assessors                                                              | Day 3                             | No reference-alignment claim without adjudication                                                                                          |
| Evaluation cases         | 30–50 worker profiles / 100+ criterion decisions if feasible                                                              | Day 5                             | Smaller pilot with explicit limitations                                                                                                    |
| QP pool                  | 10–15 QPs for mapping evaluation                                                                                          | Day 3                             | Demo-only mapping if insufficient pool                                                                                                     |
| Demo device              | Actual phone/tablet                                                                                                       | Day 5                             | Switch to known-tested device                                                                                                              |
| Model build              | Frozen model/prompt/config                                                                                                | Before study                      | No comparison results from moving model                                                                                                    |
| Organizer dataset        | Imported and schema-validated                                                                                             | When released / before evaluation | Use internal fixtures but label them clearly                                                                                               |
| Reference-label workload | Compute criterionDecisions from the actual QP after freeze; target 36 cases, no fixed criterion count before QP selection | Day 5                             | Timed 3-case adjudication pilot; budget criterionDecisions x median minutes/criterion + 20% contingency.                                   |
| Assessor workload        | 4-assessor balanced crossover; 2 ratings/condition/case; no same-assessor repeats; target 36–50 cases                     | Days 5–8                          | At 45–60 min per 12-case block: ~2.25–3.0 h/assessor for 36 cases or ~3.75–5.0 h for 50, plus challenge/debrief. 48-hour washout required. |

# 34. Evaluation Study Design

PRIMARY ENDPOINT: change in ordinal Krippendorff’s alpha between manual-only and AI-assisted conditions, with a case-level bootstrap CI. Pre-specified reporting rule: report delta alpha and its CI first. Classify the pilot as directionally supportive only when the CI excludes zero and the direction matches the pre-specified improvement hypothesis; otherwise classify it as inconclusive. Do not substitute a secondary metric for the primary endpoint.

EXPERT REFERENCE (single adjudicator for pilot; optional second-expert 10% quality check)

\|

+-------------+-------------+

\| \|

Manual condition AI-assisted condition

\| \|

Assessors Assessors

\| \|

+-------------+-------------+

\|

Compare outcomes

8.  Create a case set spanning clear, partial, ambiguous and insufficient-evidence cases. Target 36–50 cases for the hackathon study, with 30 as the minimum pilot size if resources constrain production.

9.  Create expert reference decisions before assessor scoring. For the hackathon pilot, use one named expert adjudicator and explicitly call these “expert reference labels,” not independent ground truth. If a second expert becomes available, use them for an optional 10% dual-label quality check and adjudicate disagreements before analysis. The adjudicator does not see AI challenge labels during normal adjudication.

10. Stratify by difficulty, language/task, site and evidence quality. Assign a packet-production owner on Day 5 with a fixed fixture schema and a completion checklist; synthetic/consented media is preferred for the study.

11. Use a balanced crossover design with no same-assessor repeated case: target 4 assessors and 36–50 cases. At 45–60 minutes per 12-case block, each assessor should budget roughly 2.25–3.0 hours for 36 cases or 3.75–5.0 hours for 50 cases, plus a short challenge/debrief block. Four assessors are the minimum for the primary two-ratings-per-condition design; fewer than 4 assessors disables the primary consistency claim.

12. Freeze the production candidate model/prompt/build before the AI-assisted condition. The manual-only condition may begin as soon as packets and reference cases are ready because it does not depend on the AI freeze.

13. Collect manual and AI-assisted ratings independently. Do not expose the AI condition to the assessor during the manual condition.

14. Collect review time and AI acceptance/edit/rejection/override behavior.

15. Run a separate wrong-AI-suggestion challenge subset for automation-bias testing. The challenge cases are randomized and not identified before scoring.

16. Calculate the primary endpoint first, then secondary metrics with uncertainty and limitations. If the required assessor/reference resources are not secured, do not claim an assessor-consistency improvement.

CASE ALLOCATION: use a balanced crossover without same-assessor case repetition. Split cases into matched forms A/B with balanced difficulty, language, site and evidence strata. Half of assessors receive A in manual and B in AI; the other half receive B in manual and A in AI. Every case therefore appears in both conditions across assessors, while one assessor never rates the same case twice.

WASHOUT: require at least 48 hours between each assessor’s manual and AI condition. Target manual completion by Day 5 plus early Day 6, with AI scoring beginning Day 8 only after the 48-hour gap is satisfied. If an assessor does not meet 48 hours, exclude that assessor’s paired cases from the primary consistency endpoint and classify the data as operational/secondary.

REFERENCE LABELS: expert reference decisions are frozen before assessor ratings. Record labeler, timestamp, criterion-level rationale and QP/policy version. Because the primary reference is a single expert judgement in the hackathon pilot, report this as a limitation rather than implying multi-expert consensus. The expert does not see challenge labels during normal adjudication.

REFERENCE-LABEL WORKLOAD GATE: after the actual QP is frozen, compute criterionDecisions = Σ applicable criteria across all cases. Run a timed adjudication pilot on 3 representative cases, record median minutes per criterion decision, then budget criterionDecisions × median time + 20% contingency across Day 4–5. The packet is not released for assessor scoring until the expert-reference package is complete and frozen. No unsupported fixed criterion count is assumed before the QP is selected.

CASE-PRODUCTION GATE: every packet must have caseId, QP/version, criterion set, evidence files, language, site, reference label, difficulty stratum, condition-assignment seed, challenge flag and consent/synthetic-media flag. Missing fields exclude the case from the primary analysis.

# 35. Statistical / Measurement Plan

| **Metric**                     | **Definition**                                                                   | **Notes**                                     |
|--------------------------------|----------------------------------------------------------------------------------|-----------------------------------------------|
| Weighted Cohen's kappa         | Two-rater ordinal agreement                                                      | Use for paired/appropriate designs            |
| Ordinal Krippendorff's alpha   | Multi-rater ordinal reliability                                                  | Useful with \>2 assessors and missing ratings |
| Exact agreement %              | Identical criterion rating                                                       | Simple descriptive metric                     |
| Mean absolute score difference | Average distance between raters/reference                                        | Descriptive                                   |
| Reference alignment            | Agreement/distance versus expert reference                                       | Separate from inter-rater agreement           |
| Bootstrap CI                   | Resample cases, not individual criterion rows alone                              | Use when sample permits                       |
| Review time                    | Median assessment/criterion review time                                          | Stratify by case difficulty                   |
| AI override rate               | Changed/rejected AI suggestions / AI suggestions                                 | Diagnostic, not a target                      |
| Wrong-AI catch rate            | Deliberately perturbed suggestions caught/rejected / perturbed suggestions shown | Automation-bias diagnostic                    |
| Per-site agreement             | Descriptive agreement/score drift by site                                        | Small n must be labeled descriptive           |
| Per-assessor drift             | Descriptive deviation from reference/peer distribution                           | Do not use as a punitive ranking metric       |

For ordinal scores, use ordinal-aware agreement statistics. Do not treat nominal kappa or raw percentage agreement as the sole evidence of consistency.

# 36. Wrong-AI-Suggestion Challenge

A dedicated subset tests automation bias using deliberately incorrect AI suggestions. Assessors are not told which cases are perturbed before scoring; immediately after the challenge condition, the study lead conducts and records a debrief explaining the perturbation and its purpose.

Primary study:

AI output = actual model output

Challenge study:

AI output = controlled perturbation of the real model suggestion

(wrong criterion link / inflated mark / unsupported claim)

Measure:

catchRate = incorrectAI_suggestions_rejectedOrCorrected

/ incorrectAI_suggestions_shown

- Clearly label this as a human-factors challenge, not a model-accuracy benchmark.

- Do not disclose which cases are challenge cases before assessment. Debrief assessors immediately after the challenge condition and record that the debrief occurred.

- Do not use the challenge subset to inflate/deflate the main AI-quality metric.

# 37. AI Condition Freeze and Reproducibility

| **Item**                 | **Freeze requirement** |
|--------------------------|------------------------|
| Model name/version       | Recorded               |
| Prompt version           | Recorded               |
| Qualification snapshot   | Frozen                 |
| Assessment scheme        | Frozen                 |
| Assessment policy        | Frozen                 |
| Retrieval index snapshot | Frozen or hashed       |
| Application commit       | Recorded               |
| Evaluation case set      | Frozen                 |
| Randomization seed       | Recorded               |
| Timestamp                | Recorded               |

No evaluation result should be attributed to “the AI” without recording the exact model/prompt/application/source snapshot that generated it.

# 38. Language Evaluation

| **Factor**                | **Analysis**                                                              |
|---------------------------|---------------------------------------------------------------------------|
| English/source-language   | Baseline                                                                  |
| Supported Indian language | Separate mapping/evidence analysis                                        |
| Mixed-language input      | Robustness subset                                                         |
| Translation path          | Compare direct multilingual embedding vs translation pipeline if feasible |
| STT errors                | Sample transcript accuracy against references                             |

Do not report subgroup performance from very small samples as general population conclusions. Use the dashboard as a diagnostic surface.

# 39. Site and Location Model

Site {

siteId

siteType

equipmentProfile

environmentProfile

networkProfile

geolocationPolicyVersion

siteLatitude

siteLongitude

locationAccuracyMeters

locationSource (GPS \| NETWORK \| MANUAL \| UNAVAILABLE)

}

Assessment {

assessorId

siteId

qualificationVersion

...

}

- The task definition specifies required equipment/environment conditions.

- The assessor confirms site readiness before practical assessment.

- Site is retained as an evaluation factor.

- Dashboard reports descriptive differences across sites.

- Do not rank sites as “best/worst” from a tiny hackathon sample.

# 40. Assessor Calibration

> 1\. Create a common calibration packet.
>
> 2\. Assessors score examples independently.
>
> 3\. Hide peer scores until submission.
>
> 4\. Compare scores using the official/configured assessment scheme.
>
> 5\. Review disagreement against the rubric and source evidence.
>
> 6\. Store a calibration record.
>
> 7\. Repeat after the AI workflow is introduced if appropriate.
>
> 8\. Do not automatically alter assessor scores from calibration output.

# 41. Quality Review Sampling

| **Trigger**                        | **Second-review behavior**                     |
|------------------------------------|------------------------------------------------|
| High-risk criterion                | Mandatory second review when policy/configured |
| Large AI override                  | Sample for quality review                      |
| Low AI confidence                  | Sample/require additional evidence             |
| Clock drift flag                   | Quality review                                 |
| Evidence authenticity concern      | Human review                                   |
| Unusual site/assessor distribution | Descriptive monitoring and sample review       |
| Random sample                      | Quality review across signed assessments       |

# 42. Admin / Coordinator Workflow

Coordinator preconditions: select QP/version and pathway policy; assign site; verify applicant education/enrolment context; record orientation completion and required hours; for RPL-A/Levels 1–3.5 use the cited 12–15 hour orientation requirement, while Level 4–6 flows use the cited 4–15 hour mandatory orientation range; enforce the applicable batch cap (maximum 20–30 candidates in the cited governance table); and block assessment start when required pathway/qualification context is incomplete.

| **Function**                 | **P0/P1**            |
|------------------------------|----------------------|
| Create assessment batch      | P1                   |
| Assign assessor              | P0 if multiple users |
| Assign site                  | P0                   |
| Select qualification/version | P0                   |
| View sync status             | P0                   |
| View evaluation status       | P0                   |
| Manage QP sources            | P1                   |
| Calibration                  | P1                   |
| Advanced analytics           | P1                   |

# 43. API Contract

\# Candidate

POST /api/candidates

POST /api/candidates/:id/experience

GET /api/candidates/:id

\# Mapping

POST /api/candidates/:id/mapping

GET /api/mapping-runs/:id

\# Qualification

GET /api/qualifications

GET /api/qualifications/:id

GET /api/qualifications/:id/versions

GET /api/qualifications/:id/nos

\# Assessment

POST /api/assessments

POST /api/assessments/:id/start

POST /api/assessments/:id/tasks/:taskId/evidence

PATCH /api/assessments/:id/criteria/:criterionId

GET /api/assessments/:id/profile

GET /api/assessments/:id/recommendation

POST /api/assessments/:id/finalize (action=SIGN_OFF \| FINALIZE_REFERRAL)

\# AI

POST /api/ai/transcribe

POST /api/ai/analyze-evidence

POST /api/ai/link-evidence

POST /api/ai/suggest-score

\# Assessor decision / evidence integrity

POST /api/assessments/:id/pathway-override

POST /api/assessments/:id/recommendation-decision

GET /api/assessments/:id/evidence-integrity

\# Sync

POST /api/sync/batch

GET /api/sync/changes?cursor=...

\# Import

POST /api/imports/worker-assessments

GET /api/imports/:id/report

\# Evaluation

POST /api/evaluation/runs

GET /api/evaluation/runs/:id

GET /api/evaluation/runs/:id/metrics

# 44. Server-Side Finalization / Sign-Off Transaction

POST /api/assessments/:id/finalize (action=SIGN_OFF \| FINALIZE_REFERRAL)

SERVER TRANSACTION:

1\. Verify authenticated assessor.

2\. Verify assessor authorization, role, scope, site/assignment and qualification eligibility.

3\. Verify assessment is synchronized/current; reject if unsynced, offline, or authorization is expired.

4\. Verify any mandatory orientation requirement is completed and recorded before finalization.

5\. Verify qualification, assessment-scheme and policy versions are locked to the assessment attempt.

6\. Verify every required criterion/component has an allowed decision and every mandatory evidence requirement is resolved.

7\. Verify proctoringStatus and required geotag/location evidence according to the selected qualification/policy; missing mandatory geotag/proctoring blocks or routes to review.

8\. Recalculate the official/configured score server-side from persisted criterion/component marks.

9\. Evaluate qualification-specific minimum pass rules and mandatory criteria.

10\. Evaluate RPL pathway and any assessor-confirmed threshold state.

11\. Validate the assessor decision: pathway-routing override is permitted only for rule 3 where policy allows; recommendation downgrade is permitted with rationale; upward override of mandatory/minimum-pass failure is rejected or converted to SECOND_REVIEW_REQUEST when official policy provides that route.

12\. For a suitable result, generate the competency profile and certification-recommendation package; for a negative/referral result, generate the assessment report and remediation/upskilling referral disposition.

13\. Persist systemOutcome + assessorDecision + finalDisposition + rationale/reasonCode as an immutable decision event.

14\. Transition to SIGNED_OFF or FINAL_REPORT_READY according to final disposition, then to the corresponding terminal state and LOCKED after validation.

15\. Return the authoritative final state, report/package identifiers and audit record reference.

# 45. Database Integrity Invariants

- Client cannot submit an arbitrary final result.

- Server recomputes the result from persisted criterion/component marks.

- Server validates mandatory criteria.

- Server validates assessor authorization.

- Server validates policy/qualification version.

- Server prevents duplicate sign-off.

- Signed assessments cannot be modified through normal mutation endpoints.

- Assessment amendments create explicit new versions/events.

- Audit events are append-only.

# 46. Security / Threat Model

| **Threat**                                   | **Mitigation**                                                                                                                                                            |
|----------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Unauthorized evidence                        | RBAC + resource authorization + signed URLs                                                                                                                               |
| Evidence tampering                           | Checksum + immutable versions                                                                                                                                             |
| Score tampering                              | Server-side recomputation                                                                                                                                                 |
| Prompt injection                             | Treat candidate/evidence content as untrusted                                                                                                                             |
| AI hallucination                             | Evidence references + schema + assessor review                                                                                                                            |
| Replay sync                                  | eventId idempotency                                                                                                                                                       |
| Concurrent score edits                       | Explicit conflict                                                                                                                                                         |
| Assessor credential misuse                   | Authorization/scope check + audit                                                                                                                                         |
| Rubber-stamping                              | Completeness/evidence-open/override controls + sample review                                                                                                              |
| Local theft                                  | Device encryption/native secure storage where possible                                                                                                                    |
| Storage exhaustion                           | Quota check + controlled media capture                                                                                                                                    |
| Clock manipulation                           | Server sync timestamp + drift flag                                                                                                                                        |
| Version drift                                | Qualification/rubric/policy lock                                                                                                                                          |
| GPS spoofing / fake location                 | Record location status + mockLocationFlag + geolocationIntegrityFlag; use available OS/device integrity checks; treat flags as review signals, not proof.                 |
| Location-data exposure                       | Encrypt in transit/at rest, RBAC, minimize precision/retention where policy permits, show privacy notice and explicit consent/legal basis for real-person use.            |
| Upward override attempt                      | Server rejects any override that would bypass mandatory failure or official minimum-pass failure; optionally emits SECOND_REVIEW_REQUEST when policy supports moderation. |
| Invalid final disposition / state transition | Server validates against authoritative transition table and finalDisposition enum; reject unlisted transitions.                                                           |
| Assessor attestation misuse                  | Record proctoringAttestedBy/At, assessor identity, session binding and audit event; sample for quality review.                                                            |

# 47. Accessibility

- Voice input in one Indian language is P0.

- Audio task instructions.

- Minimal typing.

- Large touch targets.

- Captions/transcripts.

- No color-only status communication.

- Assessor-operated mode for candidates with limited literacy/device access.

- Preserve original language source alongside normalized/translated content.

- Support accessible task variants where the qualification/assessment policy permits.

# 48. Privacy and Data Governance

For the hackathon demo and evaluation, external AI providers receive only synthetic or explicitly consented media. Real worker video/images must not be sent to an external model unless the deployment has the required consent/legal basis and approved vendor/data-processing controls. Vendor data handling, retention and region must be verified before any real-person media is used.

The application should be built against India's applicable data-protection requirements, including the Digital Personal Data Protection Act, 2023 and the Digital Personal Data Protection Rules, 2025, with deployment-time verification of roles, commencement dates, retention obligations and processor/vendor arrangements.

| **Area**             | **Implementation**                                  |
|----------------------|-----------------------------------------------------|
| Notice               | Explain data and media collection/use               |
| Consent/lawful basis | Store applicable basis/version/timestamp            |
| Minimization         | Keep unrelated demographic data out of AI prompts   |
| Retention            | Configurable retention by data type                 |
| Access               | Role + resource authorization                       |
| Vendor review        | Document AI/storage provider and data handling      |
| Deletion/rights      | Controlled workflow for applicable rights           |
| Logging              | Redact sensitive values                             |
| Audit                | Record sensitive decision/access events as required |

# 49. P0 / P1 / P2 Scope

| **Priority** | **Features**                                                                                                                                                                                                                                                                                                                                                                                      |
|--------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| P0-demo      | P0 DEMO: selected real QP + verified NSQF level/pathway; self-declaration; education/enrolment context; one-language voice; mapping; selected QP official assessment scheme; physical supervised practical assessment; digital/video evidence + geotagging; offline capture; sync; source-faithful server scoring; recommendation safeguards; competency profile; assessor sign-off; audit trail. |
| P1           | Additional vision tasks; calibration UI; coordinator dashboard; more languages; PDF export; richer site analytics                                                                                                                                                                                                                                                                                 |
| P2           | Nation-scale repository administration; external ecosystem integrations; advanced device management; model optimization                                                                                                                                                                                                                                                                           |
| P0-study     | P0 STUDY: 10–15 QP pool; organizer import; 4 assessors + expert adjudicator; reference-label production; counterbalanced evaluation; primary endpoint + CI; wrong-AI challenge/debrief; site/language diagnostics; workload tracking. Cut study scope before demo-critical controls if time slips.                                                                                                |

| Cut order / Cut P2 first, then P1. If schedule slips, cut P0-study scope before P0-demo scope: reduce evaluation packet count, language/site strata or advanced challenge variants, but never cut the human-only workflow, official scheme fidelity, assessor sign-off, offline sync boundary, audit trail or recommendation safeguards. |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

# 50. 10-Day Delivery Plan

DAY 1 — DEMO GATE: choose/freeze actual QP; verify NSQF level + RPL path; ingest source; verify critical NOS/criteria; capture education/context; freeze official assessment scheme.

DAY 2 — P0-DEMO: candidate/experience flow, organizer import, mapping pipeline and source-linked QP retrieval.

DAY 3 — P0-DEMO + STUDY: human-only assessment, assessor authorization; secure 4 assessors + expert adjudicator; finalize evaluation case schema.

DAY 4 — P0-DEMO + STUDY: physical supervised tasks, evidence/geotag/proctoring capture, deterministic scoring; start expert reference labeling.

DAY 5 — P0-DEMO + STUDY: offline/sync/sign-off boundary; finish reference labels and packet QA; start manual-only condition as soon as packets are ready.

DAY 6 — P0-DEMO: recommendation engine, tests, override audit, competency profile. STUDY: continue manual condition and preserve \>=48h washout before AI condition.

DAY 7 — P0-DEMO: AI assistance + exact model/prompt/build/source freeze; external provider receives synthetic/consented media only. STUDY: finalize AI packets/assignment seed.

DAY 8 — P0-DEMO: end-to-end integration/device rehearsal. STUDY: AI condition after freeze; run challenge subset and record debrief.

DAY 9 — P0-DEMO: 9:30 rehearsal + 3-minute cut + failure rehearsal. STUDY: finish ratings and compute primary endpoint/secondary diagnostics.

DAY 10 — FINAL: source/version audit, backup data, acceptance tests, bootstrap CI, site/language diagnostics, limitation statement and claim gate.

| Day | Engineering                                                                     | Non-engineering / study gate                                                                  |
|-----|---------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| 1   | QP source + data model + policy/pathway model                                   | Identify target QP; verify source; confirm demo qualification can support full scheme capture |
| 2   | Candidate flow + organizer import adapter                                       | Confirm dataset schema/availability; add education/enrolment context                          |
| 3   | Mapping + distractor pool                                                       | Secure 4 assessors + expert adjudicator; assign packet-production owner                       |
| 4   | Human-only assessment + official scoring scheme                                 | Expert reviews tasks, theory/viva fixture and scoring configuration                           |
| 5   | Evidence capture + session binding + site; start manual study packet production | Freeze demo device; begin manual-only assessor condition as packets become ready              |
| 6   | Offline outbox/sync + server sign-off                                           | Run offline device test; complete manual condition for available packets                      |
| 7   | AI evidence assistance + model trace                                            | Freeze model/prompt/build and qualification/policy/index snapshots                            |
| 8   | Competency profile + recommendation + audit; finalize AI packets                | Run AI-assisted condition; run challenge subset with controlled perturbations                 |
| 9   | Controlled evaluation completion + data validation                              | Collect assessor/reference results; debrief challenge participants                            |
| 10  | Primary endpoint + secondary analysis + polish + rehearsal                      | Validate every claim against frozen data; prepare 3-minute and 9:30 demo cuts                 |

# 51. Execution Gates

HARD GATES:

- G1 DATA GATE — actual QP/version + assessment scheme + threshold operator + critical source verification complete.

- G2 RESOURCE GATE — assessors + expert adjudicator secured before any consistency claim.

- G3 MEDIA GATE — synthetic/consented external-AI media rule; geotag/proctoring fields tested on the actual demo device.

- G4 MODEL FREEZE — model/prompt/build/config/source snapshot frozen before AI condition.

- G5 EVALUATION GATE — case allocation, washout, reference labels, primary endpoint and decision rule fixed before analysis.

- G6 CLAIM GATE — failed gates downgrade the pitch to prototype-capability claims; do not claim measured consistency improvement, generalized site/language performance or operational certification validity.

| **Gate**        | **Must be true before proceeding**                                                                                                       |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Data Gate       | Official QP + source verification + distractors loaded                                                                                   |
| Policy Gate     | Correct RPL pathway selected from level + education/enrolment context; no global 70% assumption; threshold operator/version is explicit. |
| Assessor Gate   | 4 assessors + expert adjudicator secured, or the consistency/reference claim is disabled.                                                |
| Assessment Gate | Human-only scoring works                                                                                                                 |
| Offline Gate    | Capture/reload/sync works on demo device                                                                                                 |
| AI Gate         | Structured grounded output passes validation                                                                                             |
| Study Gate      | Model/prompt/build/index/policy/QP snapshot frozen before AI-assisted condition; manual condition may already be running.                |
| Evaluation Gate | Reference cases + packet owner + minimum sample + primary endpoint defined; challenge subset and debrief procedure ready.                |
| Claim Gate      | Every pitch metric has actual supporting data                                                                                            |

# 52. Evaluation Dataset Fixtures

| **Case class**                        | **Purpose**                                |
|---------------------------------------|--------------------------------------------|
| Clear positive                        | Strong evidence meets criterion            |
| Clear negative                        | Evidence fails criterion                   |
| Partial                               | Only some required actions shown           |
| Insufficient evidence                 | Criterion not established                  |
| Ambiguous acceptable variant          | Avoid overfitting to one performance style |
| Wrong performer/context               | Integrity check                            |
| Noisy media                           | Field conditions                           |
| Language variation                    | Multilingual robustness                    |
| Prompt injection                      | AI security                                |
| Conflicting self-declaration/evidence | Human review                               |
| Wrong-AI challenge                    | Automation-bias test                       |

**Each evaluation case is versioned and owned by the packet-production lead. Required manifest: caseId, candidate profile, QP/version, criterion set, evidence media, language, site, difficulty, expert reference label, manual/AI assignment seed, challenge flag, consent/synthetic-media flag and QA status. Missing elements exclude the case from the primary analysis.**

| **Test**                | **Expected**                                                                                        |
|-------------------------|-----------------------------------------------------------------------------------------------------|
| Create candidate        | Success                                                                                             |
| Voice self-declaration  | Original + transcript + confirmation                                                                |
| Map qualification       | Top candidates + sources                                                                            |
| Select pathway          | Correct path based on level/context                                                                 |
| Start assessment        | Qualification/rubric/policy snapshots locked                                                        |
| Capture offline         | Evidence persists                                                                                   |
| Reload offline          | State restored                                                                                      |
| Reconnect               | Events/media synchronize                                                                            |
| AI failure              | Assessment still works                                                                              |
| AI invalid schema       | Output rejected/retried                                                                             |
| Edit AI suggestion      | Audit event created                                                                                 |
| Missing criterion       | Sign-off blocked                                                                                    |
| Unauthorized assessor   | Sign-off rejected                                                                                   |
| Clock drift             | Review flag created                                                                                 |
| Score recomputation     | Server result matches deterministic calculation                                                     |
| Sign-off                | Requires connectivity + authorization                                                               |
| Post-sign mutation      | Blocked                                                                                             |
| Competency profile      | Correct NSQF/NOS/criterion view                                                                     |
| Recommendation          | Decision-table output                                                                               |
| Evaluation              | Metrics reproduce from frozen run                                                                   |
| Coverage gate           | AI proposal alone cannot route to upskilling                                                        |
| Coverage override       | Assessor can override pathway recommendation only with mandatory rationale + audit flag             |
| Official full scheme    | Theory/practical/viva or all required QP components compute on demo qualification                   |
| Recommendation override | Assessor override stores systemOutcome, assessorDecision, finalDisposition and rationale separately |
| Expired offline auth    | Capture continues; provisional scoring stops; sign-off blocked                                      |
| Clock drift             | Server records skew and creates review flag                                                         |
| Client/server scoring   | Same packages/domain function produces same result; server is authoritative                         |

# 53. Acceptance Matrix

| **Capability / test**       | **Acceptance criterion**                                                                             | **Verification**                      |
|-----------------------------|------------------------------------------------------------------------------------------------------|---------------------------------------|
| Rater allocation            | Primary study uses 4 assessors, 2 ratings/condition/case, no same-assessor repeats                   | CASE ALLOCATION + data manifest       |
| Washout                     | \>=48 hours for paired manual/AI conditions; otherwise excluded from primary endpoint                | Timestamp comparison per assessor     |
| Negative finalization       | Upskilling/negative case can produce final report/referral and lock without SIGNED_OFF               | State-transition + API test           |
| State back-edge             | SIGNOFF_READY or ASSESSOR_DECISION_PENDING can reopen to ASSESSMENT_IN_PROGRESS with reason          | Transition table + T14                |
| Criterion resolution        | CRITERION_RESOLUTION_REQUIRED can return to ASSESSMENT_IN_PROGRESS                                   | Transition table test                 |
| RPL routing 70%             | AI-only coverage cannot route; assessor-confirmed coverage + configured operator controls routing    | T01–T07, T21                          |
| Mandatory/min-pass override | Upward override is rejected; second review only where policy permits                                 | T15 + server transaction              |
| Required geotag/proctoring  | Missing mandatory location/proctor status blocks/routes to review and is never auto-verified         | T20 + media policy                    |
| Orientation precondition    | Required orientation completion recorded before finalization                                         | Coordinator + server transaction test |
| Final disposition           | Allowed enum is enforced and stored separately from system outcome/assessor action                   | Schema + T18/T19                      |
| Client/server scoring       | Shared domain calculation is used; server remains authoritative                                      | Deterministic recomputation test      |
| Expert reference            | Single expert reference is explicitly labelled as such; optional second-expert 10% check is separate | Study manifest + methodology          |
| Acceptance test integrity   | No hidden zero-width characters or non-semantic box-drawing separators remain in identifiers/cells   | Unicode scan                          |

# 54. Judge Demo Script

| **Time**  | **Action**                           | **What is proved**                 |
|-----------|--------------------------------------|------------------------------------|
| 0:00–0:40 | Worker with informal experience      | Problem                            |
| 0:40–1:25 | Voice self-declaration               | Accessibility                      |
| 1:25–2:15 | QP mapping with target + distractors | Grounded mapping                   |
| 2:15–2:45 | NSQF level + pathway                 | Policy awareness                   |
| 2:45–3:30 | Start supervised task                | Assessment workflow                |
| 3:30–4:05 | Offline evidence capture             | Connectivity resilience            |
| 4:05–4:40 | Reconnect/sync                       | Reliable sync                      |
| 4:40–5:45 | AI evidence review                   | AI assistance                      |
| 5:45–6:25 | Reject/edit/accept                   | Human decision boundary            |
| 6:25–7:10 | Official/configured scoring          | Deterministic result               |
| 7:10–7:50 | Competency profile                   | NSQF/NOS outcome                   |
| 7:50–8:25 | Recommendation package               | Assessment outcome                 |
| 8:25–8:55 | Assessor sign-off + audit            | Integrity                          |
| 8:55–9:30 | Evaluation dashboard                 | Measured evidence, if actually run |

Full demo: 9:30. 3-minute cut: 0:00 worker + voice self-declaration; 0:35 grounded QP mapping + NSQF level/pathway; 1:10 supervised practical task + offline evidence capture; 1:45 reconnect/sync; 2:00 AI evidence suggestion + assessor reject/edit/accept; 2:25 official scheme score + competency profile; 2:45 certification recommendation package + assessor sign-off boundary + audit trail. If time is constrained, omit secondary analytics, not the human-control path.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Narrative rule<br />
</strong>Do not lead with computer vision or an LLM. Lead with the worker, the qualification, the evidence, the assessor and the audit trail. AI appears where it removes concrete friction.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 55. Likely Judge Questions

| **Question**                                  | **Answer**                                                                                                                                                                                                                                                              |
|-----------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Can AI certify?                               | No. It assists; the authorized human assessor signs off.                                                                                                                                                                                                                |
| What if AI is wrong?                          | Evidence-linked outputs are editable/rejectable, and final scoring uses assessor-approved values.                                                                                                                                                                       |
| Why 70%?                                      | Only the Level 1–3.5 pathway has the cited mapping gate. The Gazette Stage 3 table says \>=70%, while its flowchart/assessor-role text says \>70%; the demo therefore treats the operator as versioned/configurable and defaults to \>=70% pending policy confirmation. |
| What if the qualification is Level 4–6?       | The pathway policy changes to the applicable level/context flow rather than using the Level 1–3.5 threshold.                                                                                                                                                            |
| Are your scores official?                     | The system preserves the qualification's actual assessment scheme; any demo-specific UX anchor is explicitly auxiliary.                                                                                                                                                 |
| How prove consistency?                        | Compare manual vs AI-assisted ordinal ratings using qualified assessors and an expert reference; report uncertainty.                                                                                                                                                    |
| How handle automation bias?                   | A separate wrong-AI challenge subset measures whether assessors catch intentionally incorrect suggestions.                                                                                                                                                              |
| Why offline?                                  | Field assessment capture continues without connectivity; authoritative sign-off occurs after synchronization.                                                                                                                                                           |
| Can people cheat with another person's video? | The demo uses supervised session binding and evidence traceability; stronger identity controls are separate production integrations.                                                                                                                                    |
| Why modular monolith?                         | It minimizes deployment risk while preserving domain boundaries for later extraction.                                                                                                                                                                                   |
| Can it work for multiple trades?              | Yes; trade-specific content is represented through qualification/task/policy adapters.                                                                                                                                                                                  |
| Does it issue a government certificate?       | Not in the hackathon demo. It produces an NSQF-aligned competency profile and certification recommendation package for authorized assessor sign-off; certification remains outside the AI system.                                                                       |

# 56. Production Evolution

> 1\. Move from snapshot QP ingestion to governed qualification synchronization.
>
> 2\. Integrate authorized assessment/certification systems only after operational approval.
>
> 3\. Harden device/offline storage and identity controls.
>
> 4\. Validate evidence authenticity controls by trade and context.
>
> 5\. Build model regression/evaluation pipelines.
>
> 6\. Run independent domain validation before live operational use.
>
> 7\. Expand language coverage with dedicated evaluation sets.
>
> 8\. Add assessor calibration and quality-sampling workflows.
>
> 9\. Add production observability, retention and incident management.
>
> 10\. Extract high-load modules into services only when justified.

# 57. Final Gap Audit — Specification / Verification Status

| **Area checked**               | **Pass criterion**                                                                                | **Verification status**             |
|--------------------------------|---------------------------------------------------------------------------------------------------|-------------------------------------|
| Problem statement coverage     | Every requested capability maps to a concrete module/workflow                                     | SPECIFIED — BUILD/EVALUATION VERIFY |
| Self-declaration               | Text + voice + original-language retention                                                        | SPECIFIED — BUILD/EVALUATION VERIFY |
| QP mapping                     | Real source + larger evaluation pool                                                              | SPECIFIED — BUILD/EVALUATION VERIFY |
| Practical aids                 | Tasks/checklists/evidence requirements                                                            | SPECIFIED — BUILD/EVALUATION VERIFY |
| AI media aid                   | AI optional and evidence-grounded                                                                 | SPECIFIED — BUILD/EVALUATION VERIFY |
| Standardization                | Versioned scheme/rubric/policy                                                                    | SPECIFIED — BUILD/EVALUATION VERIFY |
| Assessor consistency           | Ordinal metrics + expert reference                                                                | SPECIFIED — BUILD/EVALUATION VERIFY |
| Location consistency           | Site factor + descriptive metrics                                                                 | SPECIFIED — BUILD/EVALUATION VERIFY |
| NSQF profile                   | Visible qualification level + NOS/criteria                                                        | SPECIFIED — BUILD/EVALUATION VERIFY |
| Recommendation                 | Executable decision table                                                                         | SPECIFIED — BUILD/EVALUATION VERIFY |
| RPL pathway                    | Level/context aware                                                                               | SPECIFIED — BUILD/EVALUATION VERIFY |
| 70% threshold                  | Only where applicable                                                                             | SPECIFIED — BUILD/EVALUATION VERIFY |
| Official scoring               | Source assessment scheme preserved                                                                | SPECIFIED — BUILD/EVALUATION VERIFY |
| Offline capture                | Works without network                                                                             | SPECIFIED — BUILD/EVALUATION VERIFY |
| Offline sign-off               | Correctly blocked until sync                                                                      | SPECIFIED — BUILD/EVALUATION VERIFY |
| Offline auth                   | Bounded session credential defined                                                                | SPECIFIED — BUILD/EVALUATION VERIFY |
| Clock integrity                | Client/server timestamps + drift                                                                  | SPECIFIED — BUILD/EVALUATION VERIFY |
| Local encryption               | Defined with PWA caveat                                                                           | SPECIFIED — BUILD/EVALUATION VERIFY |
| Media upload                   | Resumable foreground path                                                                         | SPECIFIED — BUILD/EVALUATION VERIFY |
| Assessor integrity             | Completeness/authorization/review gates                                                           | SPECIFIED — BUILD/EVALUATION VERIFY |
| Organizer dataset              | Import contract defined                                                                           | SPECIFIED — BUILD/EVALUATION VERIFY |
| Language evaluation            | Separate metrics defined                                                                          | SPECIFIED — BUILD/EVALUATION VERIFY |
| Automation bias                | Wrong-AI challenge subset                                                                         | SPECIFIED — BUILD/EVALUATION VERIFY |
| Model reproducibility          | Freeze/version all study inputs                                                                   | SPECIFIED — BUILD/EVALUATION VERIFY |
| Execution sequencing           | Resource/data/model gates                                                                         | SPECIFIED — BUILD/EVALUATION VERIFY |
| AI failure recovery            | Human-only workflow remains available                                                             | SPECIFIED — BUILD/EVALUATION VERIFY |
| Auditability                   | Evidence-to-score trace and event log                                                             | SPECIFIED — BUILD/EVALUATION VERIFY |
| Recommendation enums           | Workflow state and recommendation outcome are separate; rule-order tests exist                    | SPECIFIED — BUILD/EVALUATION VERIFY |
| Assessor override              | Recommendation disagreement requires rationale, audit flag and quality sampling                   | SPECIFIED — BUILD/EVALUATION VERIFY |
| 70% source precision           | Level 1–3.5 only; \>=70% demo default; source discrepancy documented                              | SPECIFIED — POLICY OWNER VERIFY     |
| Full assessment scheme         | Demo computes the selected QP’s required components, not practical-only unless explicitly partial | SPECIFIED — BUILD VERIFY            |
| Pathway inputs                 | Education/enrolment context captured before RPL pathway selection                                 | SPECIFIED — BUILD VERIFY            |
| Evaluation schedule            | Manual condition starts when packets are ready; AI condition starts after freeze                  | SPECIFIED — EXECUTION VERIFY        |
| Finalization / negative report | Negative/referral assessments can be finalized, reported and locked without positive SIGNED_OFF   | SPECIFIED — BUILD/EVALUATION VERIFY |
| State transition oracle        | Full transition table including required back-edges and terminal negative path is authoritative   | SPECIFIED — BUILD VERIFY            |
| Geotag/proctoring              | Required location/proctoring controls are captured and enforced when policy requires them         | SPECIFIED — BUILD VERIFY            |
| Study allocation               | Four-assessor crossover with two ratings per condition and 48-hour washout is executable          | SPECIFIED — EXECUTION VERIFY        |
| Hidden-character hygiene       | Identifiers and cells are free of zero-width and box-drawing characters                           | SPECIFIED — FILE VERIFY             |

Audit interpretation: “SPECIFIED — BUILD/EVALUATION VERIFY” means the requirement is encoded in the design and has a concrete verification method; it is not evidence that the implementation has already passed that test.

# 58. Remaining External Prerequisites — Not Design Gaps

These are dependencies outside the architecture itself. They must be acquired or confirmed before a claim is made, but they do not require another design change.

| **Prerequisite**                                    | **Owner**          | **Required before**                 |
|-----------------------------------------------------|--------------------|-------------------------------------|
| Actual selected public QP and source snapshot       | Team               | Implementation                      |
| Domain expert to validate task/rubric configuration | Team               | Evaluation                          |
| 4 assessors                                         | Team/partner       | Consistency study                   |
| Expert adjudicator                                  | Team/partner       | Reference-alignment study           |
| Organizer dummy dataset                             | Organizers/team    | Official evaluation where available |
| Actual demo device                                  | Team               | Offline rehearsal                   |
| Approved AI/model provider                          | Team               | AI study                            |
| Current applicable policy verification              | Team/domain expert | Pitch/final deployment claims       |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>No hidden design dependency<br />
</strong>If any of these prerequisites is unavailable, the correct response is to reduce the strength of the claim or narrow the scope—not to invent data, fabricate assessor results, or silently change the system's decision logic.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 59. Final Implementation Order

PHASE 1 — DOMAIN

Official QP -\> QualificationVersion -\> NOS -\> Criterion

\|

v

AssessmentScheme + Policy

PHASE 2 — HUMAN-ONLY CORE

Candidate -\> Mapping -\> Assessment -\> Evidence

\|

v

Assessor scoring

\|

v

Profile + Recommendation

\|

v

Sign-off + Audit

PHASE 3 — FIELD RESILIENCE

Offline state -\> Outbox -\> Resumable upload

\|

v

Server sync

PHASE 4 — AI ASSISTANCE

Mapping AI -\> Evidence AI -\> Criterion links

\|

v

Assessor review

PHASE 5 — EVALUATION

Expert reference -\> Manual/AI conditions

\|

+--\> Agreement

+--\> Reference alignment

+--\> Efficiency

+--\> Wrong-AI catch rate

+--\> Assessor/site diagnostics

# 60. Final Architecture Verdict

After this revision, the design separates workflow state from recommendation outcome, requires assessor confirmation before a mapping threshold can affect routing, supports explicit assessor overrides, preserves the selected QP’s full assessment scheme, captures education/enrolment context for pathway selection, makes offline expiry and client/server scoring behavior explicit, restricts external AI media to synthetic/consented data for the demo, gives the evaluation a primary endpoint and executable schedule, and treats the NCVET 70% wording discrepancy as a documented source issue rather than an invented certainty. The remaining work is implementation and acquisition of the named external prerequisites, not another architecture rewrite.

SYSTEM OF RECORD

Qualification source/version

\+

Assessment scheme/policy

\+

Evidence

\+

Assessor-approved criterion decisions

\+

Server-side recomputation

\+

Human sign-off

\+

Immutable audit

AI ASSISTANCE LAYER

Mapping

Transcription

Evidence observation

Criterion linkage

Score suggestion

Summary

AI CAN HELP.

AI CANNOT CERTIFY.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Final build rule<br />
</strong>The strongest submission is not the one with the most AI. It is the one that can demonstrate, in one uninterrupted workflow, that an informal worker's prior experience can be mapped to an appropriate qualification, assessed against real source-aligned criteria, supported by evidence even under poor connectivity, reviewed consistently by an assessor, and converted into a traceable recommendation without surrendering the final decision to an AI model.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# Appendix A — Official Sources Checked for v4

| **Source**                          | **Verification use**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|-------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| NCVET Policies and Guidelines page  | Current policy/guideline index and RPL publication listing. https://ncvet.gov.in/guidelines                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| NCVET RPL Gazette — June 19, 2024   | Four level/context RPL flows; Level 1–3.5 direct-assessment mapping threshold; governance requirements including proctored digital/video evidence with geotagging and the 20–30 batch cap; orientation and pathway-specific assessment composition. The Stage 3 table says “equal or more than 70%”, while Annexure-1 / §6.2(c) use “\>70% / more than 70%”; this internal source discrepancy is recorded in §3. Exact PDF page references are intentionally omitted here unless independently verified against the rendered source copy. https://ncvet.gov.in/wp-content/uploads/2024/09/RPL.pdf |
| NCVET RPL Guidelines 2023           | RPL framework, experiential-learning mapping and assessment context. https://ncvet.gov.in/wp-content/uploads/2023/08/Final-RPL-guidelines.pdf                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| NCVET KaushalVerse / NQR            | Official qualification repository for target QP selection/versioning. https://www.kaushalverse.ncvet.gov.in/homepage/repository                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| NCVET NSQF material                 | NSQF levels and competency framework context. https://ncvet.gov.in/national-skills-qualification-framework/nsqf-notification/                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| NCVET Training of Assessors Gazette | Assessor role, tools/checklists and quality context. https://ncvet.gov.in/wp-content/uploads/2024/09/TOA.pdf                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| NCVET NOS guidance                  | NOS development/approval/usage and assessment-criteria context. https://ncvet.gov.in/wp-content/uploads/2023/07/Guidelines-for-Development-Approval-Usage-of-National-Occupational-Standards-NOS-Micro-Credentials-MC.pdf                                                                                                                                                                                                                                                                                                                                                                         |
| MeitY DPDP Rules 2025               | Current data-protection rules source for deployment-time privacy/vendor controls. https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf                                                                                                                                                                                                                                                                                                                                                                                                                            |
