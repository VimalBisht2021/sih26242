import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const API_BASE = 'http://localhost:4000/api';

describe('PS26242 End-to-End Workflow Verification Suite', () => {
  let createdCandidateId: string;
  let targetQualificationCode = 'AMH/Q0301';
  let activeAssessmentId: string;
  let activeSessionId: string;
  let firstEvidenceId: string;
  let firstCriterionId: string;
  let negativeCandidateId: string;
  let negativeAssessmentId: string;

  // -------------------------------------------------------------------------
  // 1. Candidate Creation & Context Verification
  // -------------------------------------------------------------------------
  it('Step 1: Should create a new candidate with verified educational context', async () => {
    const res = await fetch(`${API_BASE}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Rajesh Kumar Tailor',
        primaryLanguage: 'hi',
        phone: '+91-9876543299',
        highestFormalEducation: 'NONE',
        currentEnrolment: 'NONE',
        applicantContextSource: 'SELF_DECLARED',
        consentVersion: 'dpdp-2026-v1'
      })
    });

    assert.equal(res.status, 201, 'Candidate creation must return 201 Created');
    const data = await res.json();
    assert.ok(data.candidate?.id, 'Candidate must have generated ID');
    assert.equal(data.candidate.fullName, 'Rajesh Kumar Tailor');
    assert.equal(data.candidate.highestFormalEducation, 'NONE');
    assert.equal(data.candidate.currentEnrolment, 'NONE');
    createdCandidateId = data.candidate.id;
  });

  // -------------------------------------------------------------------------
  // 2. Experience Self-Declaration (Simulated Voice/Text Capture)
  // -------------------------------------------------------------------------
  it('Step 2: Should record candidate experience statement with normalized skills', async () => {
    const res = await fetch(`${API_BASE}/candidates/${createdCandidateId}/experience`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText: 'मैं 5 साल से गारमेंट एक्सपोर्ट फैक्ट्री में सिंगल नीडल सिलाई मशीन चला रहा हूँ। कॉटन और डेनिम पर सीधी सिलाई, कॉलर और कफ जोड़ना, और धागा बदलना अच्छी तरह जानता हूँ।',
        detectedLanguage: 'hi',
        yearsExperience: 5,
        source: 'VOICE_HINDI',
        normalizedSkills: [
          'Single needle lockstitch machine operation',
          'Collar and cuff assembly',
          'Fabric alignment and feeding',
          'Needle and thread maintenance',
          'Industrial sewing safety'
        ],
        declaredTasks: ['Straight stitching', 'Collar joining', 'Bobbin threading'],
        declaredTools: ['Single needle lockstitch machine', 'Fabric scissors', 'Measuring tape'],
        declaredOutputs: ['Export shirts', 'Denim seams']
      })
    });

    assert.equal(res.status, 201, 'Experience record must return 201 Created');
    const data = await res.json();
    assert.equal(data.statement.candidateId, createdCandidateId);
    assert.equal(data.statement.yearsExperience, 5);
    assert.ok(data.statement.normalizedSkills.length >= 4);
  });

  // -------------------------------------------------------------------------
  // 3. Qualification Mapping & Provenance Verification
  // -------------------------------------------------------------------------
  it('Step 3: Should execute qualification mapping and return exact source provenance', async () => {
    const res = await fetch(`${API_BASE}/candidates/${createdCandidateId}/mapping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    assert.equal(res.status, 201, 'Mapping must return 201 Created');
    const result = await res.json();
    assert.ok(result.success);
    assert.ok(result.mapping?.topCandidates?.length > 0);

    const topMatch = result.mapping.topCandidates[0];
    assert.equal(topMatch.qualificationCode, targetQualificationCode);
    assert.ok(topMatch.relevanceScore >= 0.7, `Relevance score (${topMatch.relevanceScore}) must meet or exceed 0.7`);
  });

  // -------------------------------------------------------------------------
  // 4. Assessment Session Initialization with Confirmed Coverage & Orientation Check
  // -------------------------------------------------------------------------
  it('Step 4: Should initialize assessment with confirmed coverage and RPL pathway determination', async () => {
    const res = await fetch(`${API_BASE}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: createdCandidateId,
        qualificationCode: targetQualificationCode,
        assessorId: 'ASR-01',
        siteId: 'SITE-01',
        aiProposedMappedCoverage: 85.0,
        assessorConfirmedMappedCoverage: 85.0
      })
    });

    assert.equal(res.status, 201, 'Assessment creation must return 201 Created');
    const data = await res.json();
    assert.ok(data.assessment?.id);
    activeAssessmentId = data.assessment.id;
    assert.equal(data.assessment.rplPathway, 'RPL_A', 'Informal candidate with >=70% coverage must route to RPL_A');
  });

  // -------------------------------------------------------------------------
  // 5. Supervised Practical Session Start
  // -------------------------------------------------------------------------
  it('Step 5: Should start supervised practical assessment session', async () => {
    const res = await fetch(`${API_BASE}/assessments/${activeAssessmentId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessorId: 'ASR-01',
        deviceId: 'tab-oklah-01'
      })
    });

    assert.equal(res.status, 201, 'Session start must return 201 Created');
    const startRes = await res.json();
    assert.equal(startRes.workflowState, 'ASSESSMENT_IN_PROGRESS');
    assert.ok(startRes.session?.id);
    activeSessionId = startRes.session.id;
  });

  // -------------------------------------------------------------------------
  // 6. Practical Task Evidence Submission with Provenance Tagging (All 5 Mandatory Tasks)
  // -------------------------------------------------------------------------
  it('Step 6: Should capture and store practical task evidence with geotag and proctoring attestation for all required tasks', async () => {
    const tasks = ['T1', 'T2', 'T3', 'T4', 'T5'];

    for (const taskCode of tasks) {
      const res = await fetch(`${API_BASE}/assessments/${activeAssessmentId}/tasks/${taskCode}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captureId: `CAP-E2E-${taskCode}-${Date.now()}`,
          sessionId: activeSessionId,
          candidateId: createdCandidateId,
          assessorId: 'ASR-01',
          siteId: 'SITE-01',
          taskCode,
          evidenceType: taskCode === 'T1' || taskCode === 'T4' ? 'IMAGE' : 'VIDEO',
          fileUri: `/media/e2e/${taskCode}_task.mp4`,
          sha256: createHash('sha256').update(`E2E-PAYLOAD-${taskCode}`).digest('hex'),
          deviceId: 'tab-oklah-01',
          capturedAtClient: new Date().toISOString(),
          clientTimezone: 'Asia/Kolkata',
          clockSkewSeconds: 1,
          latitude: 28.5355,
          longitude: 77.2732,
          locationAccuracyMeters: 6.5,
          locationStatus: 'AVAILABLE',
          mockLocationFlag: false,
          geolocationIntegrityFlag: true,
          proctoringStatus: 'VERIFIED',
          proctoringAttestedBy: 'ASR-01'
        })
      });

      assert.equal(res.status, 201, `Evidence upload for ${taskCode} must return 201 Created`);
      const data = await res.json();
      assert.ok(data.evidence?.id);
      if (taskCode === 'T1') {
        firstEvidenceId = data.evidence.id;
      }
    }
  });

  // -------------------------------------------------------------------------
  // 7. Human Assessor Authoritative Criterion Scoring
  // -------------------------------------------------------------------------
  it('Step 7: Should record human assessor criterion evaluations under official scheme', async () => {
    const asmRes = await fetch(`${API_BASE}/assessments/${activeAssessmentId}`);
    const asmData = await asmRes.json();
    const criteriaAssessments = asmData.assessment.criterionAssessments;
    assert.ok(criteriaAssessments.length >= 12, 'Target QP must have 12 criteria across 5 compulsory NOS');
    firstCriterionId = criteriaAssessments[0].criterionId;

    // Score all criteria to achieve passing score (>= 70%) with all mandatory criteria passing
    for (const ca of criteriaAssessments) {
      const crit = ca.criterion;
      const prac = crit.practicalMarks; // full practical marks
      const viva = crit.vivaMarks;       // full viva marks
      const theory = Math.round(crit.theoryMarks * 0.8);
      const total = prac + viva + theory;

      const patchRes = await fetch(`${API_BASE}/assessments/${activeAssessmentId}/criteria/${ca.criterionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessorId: 'ASR-01',
          status: 'DEMONSTRATED',
          practicalMarks: prac,
          theoryMarks: theory,
          vivaMarks: viva,
          assessorNote: 'E2E verified candidate practical demonstration.',
          evidenceOpened: true
        })
      });

      assert.equal(patchRes.status, 200, `Criterion ${crit.code} must update successfully`);
      const updated = await patchRes.json();
      assert.equal(updated.criterionAssessment?.status, 'DEMONSTRATED');
      assert.equal(updated.criterionAssessment?.totalAwardedMarks, total);
    }
  });

  // -------------------------------------------------------------------------
  // 8. AI Observation Analysis (Advisory Only)
  // -------------------------------------------------------------------------
  it('Step 8: Should provide AI evidence suggestion without mutating authoritative scores', async () => {
    const res = await fetch(`${API_BASE}/ai/analyze-evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evidenceId: firstEvidenceId,
        evidenceUri: '/media/e2e/T1_task.mp4',
        taskCode: 'T1',
        applicableCriteriaIds: [firstCriterionId]
      })
    });

    assert.equal(res.status, 201, 'AI analysis endpoint must return 201 Created');
    const aiData = await res.json();
    assert.ok(aiData.success);
    assert.match(aiData.decisionOwnerNotice, /AI CAN HELP. AI CANNOT CERTIFY/);
    assert.ok(Array.isArray(aiData.observations));

    // Verify assessment workflowState remains in progress and unmutated by AI call
    const checkRes = await fetch(`${API_BASE}/assessments/${activeAssessmentId}`);
    const checkData = await checkRes.json();
    assert.equal(checkData.assessment.workflowState, 'ASSESSMENT_IN_PROGRESS');
  });

  // -------------------------------------------------------------------------
  // 9. Competency Profile & Recommendation Engine Verification
  // -------------------------------------------------------------------------
  it('Step 9: Should compute deterministic competency profile and recommend certification', async () => {
    const res = await fetch(`${API_BASE}/assessments/${activeAssessmentId}/recommendation`);
    assert.equal(res.status, 200);
    const data = await res.json();

    assert.equal(data.recommendation.systemOutcome, 'SUITABLE_FOR_SIGNOFF');
    assert.equal(data.recommendation.mandatoryCriteriaPass, true, 'Mandatory criteria must pass');
    assert.equal(data.recommendation.qualifyingRulePassed, true, 'Qualifying rule must pass');
    assert.equal(data.recommendation.thresholdPassed, true, 'Coverage threshold must be satisfied');
  });

  // -------------------------------------------------------------------------
  // 10. Safeguard: Prohibition of Offline Finalization
  // -------------------------------------------------------------------------
  it('Step 10: Should reject finalization attempt submitted via offline mode', async () => {
    const res = await fetch(`${API_BASE}/assessments/${activeAssessmentId}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessorId: 'ASR-01',
        action: 'SIGN_OFF',
        requestedFinalDisposition: 'SUITABLE_FOR_SIGNOFF',
        rationale: 'Attempting invalid offline finalization',
        isOfflineSubmission: true
      })
    });

    assert.equal(res.status, 400, 'Offline finalization must return 400 Bad Request');
    const err = await res.json();
    assert.match(err.message, /Offline finalization is prohibited/i);
  });

  // -------------------------------------------------------------------------
  // 11. Authoritative Positive Finalization: SIGNED_OFF -> LOCKED
  // -------------------------------------------------------------------------
  it('Step 11: Should execute server recomputation, finalize sign-off, and lock record', async () => {
    const res = await fetch(`${API_BASE}/assessments/${activeAssessmentId}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessorId: 'ASR-01',
        action: 'SIGN_OFF',
        requestedFinalDisposition: 'SUITABLE_FOR_SIGNOFF',
        rationale: 'Candidate demonstrated all mandatory competencies under supervised examination.'
      })
    });

    assert.equal(res.status, 201, 'Sign-off must return 201 Created');
    const result = await res.json();
    assert.ok(result.success);
    assert.equal(result.workflowState, 'SIGNED_OFF');
    assert.equal(result.finalDisposition, 'SUITABLE_FOR_SIGNOFF');
    assert.equal(result.isLocked, true);
    assert.ok(result.lockedAt);
    assert.ok(result.certificationRecommendationPackage);
    assert.equal(result.certificationRecommendationPackage.candidateName, 'Rajesh Kumar Tailor');
  });

  // -------------------------------------------------------------------------
  // 12. Immutability Guard: Rejection of Post-Lock Modification
  // -------------------------------------------------------------------------
  it('Step 12: Should strictly reject post-lock mutation attempts', async () => {
    const res = await fetch(`${API_BASE}/assessments/${activeAssessmentId}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessorId: 'ASR-01',
        action: 'SIGN_OFF',
        requestedFinalDisposition: 'SUITABLE_FOR_SIGNOFF',
        rationale: 'Attempting post-lock mutation'
      })
    });

    assert.equal(res.status, 400, 'Post-lock finalization must return 400 Bad Request');
    const err = await res.json();
    assert.match(err.message, /already LOCKED/i);
  });

  // -------------------------------------------------------------------------
  // 13. Negative Path: Insufficient Candidate -> Negative Referral -> LOCKED
  // -------------------------------------------------------------------------
  it('Step 13: Should process negative assessment and finalize upskilling referral into LOCKED state', async () => {
    // Create Candidate 2 for negative path
    const candRes = await fetch(`${API_BASE}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Amit Shinde (Negative Test Case)',
        primaryLanguage: 'hi',
        phone: '+91-9876543288',
        highestFormalEducation: 'NONE',
        currentEnrolment: 'NONE',
        applicantContextSource: 'SELF_DECLARED',
        consentVersion: 'dpdp-2026-v1'
      })
    });
    const candData = await candRes.json();
    negativeCandidateId = candData.candidate.id;

    // Create assessment
    const asmRes = await fetch(`${API_BASE}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: negativeCandidateId,
        qualificationCode: targetQualificationCode,
        assessorId: 'ASR-01',
        siteId: 'SITE-01',
        aiProposedMappedCoverage: 50.0,
        assessorConfirmedMappedCoverage: 50.0 // below 70% threshold
      })
    });
    const asmData = await asmRes.json();
    negativeAssessmentId = asmData.assessment.id;

    // Start session
    await fetch(`${API_BASE}/assessments/${negativeAssessmentId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessorId: 'ASR-01',
        deviceId: 'tab-oklah-01'
      })
    });

    // Attempt invalid upward override: Trying to SIGN_OFF a candidate with 0 marks
    const illegalOverrideRes = await fetch(`${API_BASE}/assessments/${negativeAssessmentId}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessorId: 'ASR-01',
        action: 'SIGN_OFF',
        requestedFinalDisposition: 'SUITABLE_FOR_SIGNOFF',
        rationale: 'Illegal attempt to pass candidate with 0 marks'
      })
    });
    assert.equal(illegalOverrideRes.status, 400, 'Upward override on failing candidate must be rejected');

    // Legitimate negative finalization: FINALIZE_REFERRAL
    const referralRes = await fetch(`${API_BASE}/assessments/${negativeAssessmentId}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessorId: 'ASR-01',
        action: 'FINALIZE_REFERRAL',
        requestedFinalDisposition: 'UPSKILLING_REFERRAL',
        rationale: 'Candidate experiential coverage is below policy threshold. Referred for 120-hour upskilling.'
      })
    });

    assert.equal(referralRes.status, 201, 'Referral finalization must return 201 Created');
    const referralData = await referralRes.json();
    assert.equal(referralData.workflowState, 'REPORT_FINALIZED_NOT_RECOMMENDED');
    assert.equal(referralData.finalDisposition, 'UPSKILLING_REFERRAL');
    assert.equal(referralData.isLocked, true);
    assert.ok(referralData.negativeReport);
    assert.equal(referralData.negativeReport.finalDisposition, 'UPSKILLING_REFERRAL');
  });

  // -------------------------------------------------------------------------
  // 14. Batch Synchronization: Idempotency & Clock Integrity
  // -------------------------------------------------------------------------
  it('Step 14: Should process batch sync events with clock validation and event deduplication', async () => {
    const eventId = `EVT-SYNC-${Date.now()}`;
    const batchPayload = {
      deviceId: 'tab-oklah-01',
      items: [
        {
          eventId,
          deviceId: 'tab-oklah-01',
          entityType: 'Evidence',
          entityId: `CAP-SYNC-${Date.now()}`,
          operation: 'CREATE' as const,
          baseVersion: 1,
          clientSequence: 1,
          createdAt: new Date().toISOString(),
          payload: {
            assessmentId: activeAssessmentId,
            sessionId: activeSessionId,
            candidateId: createdCandidateId,
            assessorId: 'ASR-01',
            siteId: 'SITE-01',
            taskCode: 'T2',
            evidenceType: 'VIDEO',
            fileUri: '/media/demo/task2_sync.mp4'
          }
        }
      ]
    };

    // First sync
    const res1 = await fetch(`${API_BASE}/sync/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchPayload)
    });
    assert.equal(res1.status, 201);
    const sync1 = await res1.json();
    assert.equal(sync1.success, true);
    assert.equal(sync1.results[0].status, 'APPLIED');

    // Duplicate sync attempt with identical eventId (idempotency verification)
    const res2 = await fetch(`${API_BASE}/sync/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchPayload)
    });
    assert.equal(res2.status, 201);
    const sync2 = await res2.json();
    assert.equal(sync2.success, true);
    assert.equal(sync2.results[0].status, 'DUPLICATE', 'Duplicate event must be explicitly reported as DUPLICATE');
  });

  // -------------------------------------------------------------------------
  // 15. Evaluation Provenance Classification Gate Verification
  // -------------------------------------------------------------------------
  it('Step 15: Should return SYNTHETIC_DEMO provenance and honest disclosure on evaluation endpoints', async () => {
    const runRes = await fetch(`${API_BASE}/evaluation/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(runRes.status, 201);
    const run = await runRes.json();
    assert.ok(run.runId);

    const metricsRes = await fetch(`${API_BASE}/evaluation/runs/${run.runId}/metrics`);
    assert.equal(metricsRes.status, 200);
    const metrics = await metricsRes.json();

    assert.equal(metrics.evaluationDataType, 'SYNTHETIC_DEMO');
    assert.equal(metrics.dataProvenance, 'SYNTHETIC_DEMO_FIXTURE');
    assert.match(metrics.provenanceNotice, /DEMO \/ SYNTHETIC EVALUATION PILOT/);
    assert.match(metrics.reportingStatement, /DEMO \/ SYNTHETIC EVALUATION/);
  });
});
