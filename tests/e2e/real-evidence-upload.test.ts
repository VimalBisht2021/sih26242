import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const API_BASE = 'http://localhost:4000/api';

describe('Real Evidence Capture and Upload Verification Suite (Requirement 26)', () => {
  let assessmentIdA: string;
  let candidateIdA: string;
  let assessmentIdB: string;
  let candidateIdB: string;

  let evidence1Id: string;
  let evidence1Sha: string;
  let evidence2Id: string;
  let evidence2Sha: string;

  // Known test JPEG fixtures (Valid JPEG binary headers)
  const testImage1 = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x03, 0x02, 0x02, 0x03, 0x02, 0x02, 0x03, 0x03, 0x03, 0x03, 0x04,
    0x06, 0x04, 0x04, 0x04, 0x04, 0x04, 0x08, 0x06, 0x06, 0x05, 0x06, 0x09,
    0x08, 0x0a, 0x0a, 0x09, 0x08, 0x09, 0x09, 0x0a, 0x0c, 0x0f, 0x0c, 0x0a,
    0x0b, 0x0e, 0x0b, 0x09, 0x09, 0x0d, 0x11, 0x0d, 0x0e, 0x0f, 0x10, 0x10,
    0x11, 0x10, 0x0a, 0x0c, 0x12, 0x13, 0x12, 0x10, 0x13, 0x0f, 0x10, 0x10,
    0x10, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01,
    0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff,
    0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xbf, 0x80, 0xff,
    0xd9
  ]);

  // Different image bytes with distinct content
  const testImage2 = Buffer.concat([
    testImage1.subarray(0, 140),
    Buffer.from([0x01, 0x02, 0x03, 0x04, 0xff, 0xd9])
  ]);

  const expectedSha1 = createHash('sha256').update(testImage1).digest('hex');
  const expectedSha2 = createHash('sha256').update(testImage2).digest('hex');

  // Setup: Create candidate and assessment
  it('Setup: Should create Candidate A and start an assessment session', async () => {
    const candRes = await fetch(`${API_BASE}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Candidate Real Evidence A',
        primaryLanguage: 'hi',
        phone: '+91-9876543210',
        highestFormalEducation: 'NONE',
        currentEnrolment: 'NONE',
        applicantContextSource: 'SELF_DECLARED',
        consentVersion: 'dpdp-2026-v1'
      })
    });
    assert.equal(candRes.status, 201);
    const candData = await candRes.json();
    candidateIdA = candData.candidate.id;

    // Record experience
    const expRes = await fetch(`${API_BASE}/candidates/${candidateIdA}/experience`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText: '5 years of industrial single needle stitching experience',
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
    assert.equal(expRes.status, 201);

    // Map qualification
    const mapRes = await fetch(`${API_BASE}/candidates/${candidateIdA}/mapping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(mapRes.status, 201);

    // Initialize assessment
    const initRes = await fetch(`${API_BASE}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: candidateIdA,
        qualificationCode: 'AMH/Q0301',
        assessorId: 'ASR-01',
        siteId: 'SITE-01',
        aiProposedMappedCoverage: 85.0,
        assessorConfirmedMappedCoverage: 85.0
      })
    });
    assert.equal(initRes.status, 201);
    const initData = await initRes.json();
    assessmentIdA = initData.assessment.id;
    assert.ok(assessmentIdA, 'Assessment A ID must exist');

    // Start assessment session
    const startRes = await fetch(`${API_BASE}/assessments/${assessmentIdA}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessorId: 'ASR-01', deviceId: 'test-device-01' })
    });
    assert.equal(startRes.status, 201);
  });

  // -------------------------------------------------------------------------
  // Test 1: Upload a known test image
  // -------------------------------------------------------------------------
  it('Test 1: Upload known test image -> HTTP success, Evidence record created, server SHA-256 matches expected', async () => {
    const formData = new FormData();
    const blob = new Blob([testImage1], { type: 'image/jpeg' });
    formData.append('file', blob, 'sample_task1.jpg');
    formData.append('taskCode', 'T1');
    formData.append('assessorId', 'ASR-01');
    formData.append('clientSha256', expectedSha1);
    formData.append('capturedAtClient', new Date().toISOString());
    formData.append('latitude', '28.5355');
    formData.append('longitude', '77.2732');

    const res = await fetch(`${API_BASE}/assessments/${assessmentIdA}/tasks/T1/evidence/upload`, {
      method: 'POST',
      body: formData
    });

    assert.equal(res.status, 201, 'Upload should return 201 Created');
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.serverSha256, expectedSha1, 'Server-computed SHA-256 must match expected hash of uploaded bytes');
    assert.ok(data.evidence?.id, 'Evidence ID must be generated');
    assert.equal(data.evidence.taskCode, 'T1');
    assert.ok(data.evidence.fileUri.startsWith('/evidence/'), 'Storage key must use relative /evidence/... path');

    evidence1Id = data.evidence.id;
    evidence1Sha = data.evidence.sha256;

    // Verify retrieval of actual stored bytes
    const fileRes = await fetch(`${API_BASE}/assessments/${assessmentIdA}/evidence/${evidence1Id}/file`);
    assert.equal(fileRes.status, 200, 'File retrieval endpoint must return 200 OK');
    assert.equal(fileRes.headers.get('content-type'), 'image/jpeg');
    const retrievedBuffer = Buffer.from(await fileRes.arrayBuffer());
    assert.equal(retrievedBuffer.length, testImage1.length, 'Stored file length must match uploaded bytes');
    assert.equal(createHash('sha256').update(retrievedBuffer).digest('hex'), expectedSha1, 'Stored file content hash must match');
  });

  // -------------------------------------------------------------------------
  // Test 2: Upload second image with different content -> hashes differ
  // -------------------------------------------------------------------------
  it('Test 2: Upload second image with different content -> server SHA-256 differs from first image', async () => {
    assert.notEqual(expectedSha1, expectedSha2, 'Test fixtures must have distinct SHA-256 hashes');

    const formData = new FormData();
    const blob = new Blob([testImage2], { type: 'image/jpeg' });
    formData.append('file', blob, 'sample_task3.jpg');
    formData.append('taskCode', 'T3');
    formData.append('assessorId', 'ASR-01');
    formData.append('clientSha256', expectedSha2);
    formData.append('capturedAtClient', new Date().toISOString());

    const res = await fetch(`${API_BASE}/assessments/${assessmentIdA}/tasks/T3/evidence/upload`, {
      method: 'POST',
      body: formData
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.serverSha256, expectedSha2);
    assert.notEqual(data.serverSha256, evidence1Sha, 'Hashes of different images must not collide');

    evidence2Id = data.evidence.id;
    evidence2Sha = data.evidence.sha256;
  });

  // -------------------------------------------------------------------------
  // Test 3: Tamper with client bytes/hash relationship -> integrity failure
  // -------------------------------------------------------------------------
  it('Test 3: Upload with mismatched client SHA-256 -> integrity failure and rejection', async () => {
    const formData = new FormData();
    const blob = new Blob([testImage1], { type: 'image/jpeg' });
    formData.append('file', blob, 'tampered.jpg');
    formData.append('taskCode', 'T2');
    formData.append('assessorId', 'ASR-01');
    // Deliberately tamper with client SHA
    formData.append('clientSha256', '0000000000000000000000000000000000000000000000000000000000000000');
    formData.append('capturedAtClient', new Date().toISOString());

    const res = await fetch(`${API_BASE}/assessments/${assessmentIdA}/tasks/T2/evidence/upload`, {
      method: 'POST',
      body: formData
    });

    assert.equal(res.status, 400, 'Tampered hash must be rejected with HTTP 400');
    const data = await res.json();
    assert.match(data.message, /INTEGRITY_MISMATCH/i, 'Error message must specify integrity mismatch');
  });

  // -------------------------------------------------------------------------
  // Test 4: Verify task association: T1 is captured, T2 is pending
  // -------------------------------------------------------------------------
  it('Test 4: Verify task association: T1 has evidence, T2 remains pending', async () => {
    const res = await fetch(`${API_BASE}/assessments/${assessmentIdA}`);
    assert.equal(res.status, 200);
    const data = await res.json();

    const allEvidence = data.assessment.sessions.flatMap((s: any) => s.evidenceItems || []);
    const t1Evidence = allEvidence.filter((e: any) => e.taskCode === 'T1');
    const t2Evidence = allEvidence.filter((e: any) => e.taskCode === 'T2');
    const t3Evidence = allEvidence.filter((e: any) => e.taskCode === 'T3');

    assert.ok(t1Evidence.length >= 1, 'T1 must have captured evidence');
    assert.equal(t2Evidence.length, 0, 'T2 must have 0 evidence items (pending)');
    assert.ok(t3Evidence.length >= 1, 'T3 must have captured evidence');
  });

  // -------------------------------------------------------------------------
  // Test 5: Verify evidence persistence across API queries
  // -------------------------------------------------------------------------
  it('Test 5: Re-query assessment and evidence integrity -> evidence persists with verified digest', async () => {
    const integrityRes = await fetch(`${API_BASE}/assessments/${assessmentIdA}/evidence-integrity`);
    assert.equal(integrityRes.status, 200);
    const integrityData = await integrityRes.json();

    assert.equal(integrityData.success, true);
    assert.ok(integrityData.integrity.totalEvidenceCount >= 2, 'Must report at least 2 evidence items');

    const item1 = integrityData.integrity.evidenceItems.find((e: any) => e.evidenceId === evidence1Id);
    assert.ok(item1, 'Evidence 1 must be present in integrity report');
    assert.equal(item1.sha256, expectedSha1);
    assert.equal(item1.proctoringStatus, 'VERIFIED');
  });

  // -------------------------------------------------------------------------
  // Test 6: Create Candidate B -> Candidate A evidence does NOT appear for B
  // -------------------------------------------------------------------------
  it('Test 6: Candidate B assessment must have zero evidence; Candidate A evidence must not leak', async () => {
    const candRes = await fetch(`${API_BASE}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Candidate Isolated B',
        primaryLanguage: 'en',
        highestFormalEducation: 'NONE',
        currentEnrolment: 'NONE',
        applicantContextSource: 'SELF_DECLARED',
        consentVersion: 'dpdp-2026-v1'
      })
    });
    const candData = await candRes.json();
    candidateIdB = candData.candidate.id;

    await fetch(`${API_BASE}/candidates/${candidateIdB}/experience`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText: 'Garment stitching experience for candidate B',
        detectedLanguage: 'en',
        yearsExperience: 4,
        source: 'TEXT',
        normalizedSkills: ['Single needle lockstitch machine operation']
      })
    });

    await fetch(`${API_BASE}/candidates/${candidateIdB}/mapping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const initRes = await fetch(`${API_BASE}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: candidateIdB,
        qualificationCode: 'AMH/Q0301',
        assessorId: 'ASR-01',
        siteId: 'SITE-01',
        aiProposedMappedCoverage: 80.0,
        assessorConfirmedMappedCoverage: 80.0
      })
    });
    const initData = await initRes.json();
    assessmentIdB = initData.assessment.id;

    await fetch(`${API_BASE}/assessments/${assessmentIdB}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessorId: 'ASR-01', deviceId: 'test-device-02' })
    });

    // Check Candidate B evidence
    const resB = await fetch(`${API_BASE}/assessments/${assessmentIdB}`);
    const dataB = await resB.json();
    const evidenceB = dataB.assessment.sessions.flatMap((s: any) => s.evidenceItems || []);
    assert.equal(evidenceB.length, 0, 'Candidate B must have NO evidence captured initially');

    // Cross-tenant file access check: Candidate B assessment path cannot access Candidate A evidence
    const crossAccessRes = await fetch(`${API_BASE}/assessments/${assessmentIdB}/evidence/${evidence1Id}/file`);
    assert.equal(crossAccessRes.status, 404, 'Accessing Candidate A evidence via Candidate B assessment must return 404');
  });

  // -------------------------------------------------------------------------
  // Test 7: Verify Audit Event integration
  // -------------------------------------------------------------------------
  it('Test 7: Audit log must record EVIDENCE_CAPTURED with server SHA-256', async () => {
    const res = await fetch(`${API_BASE}/assessments/${assessmentIdA}`);
    const data = await res.json();

    const auditEvents = data.assessment.auditEvents || [];
    const evidenceAudit = auditEvents.find((e: any) => e.eventType === 'EVIDENCE_CAPTURED' && e.entityId === evidence1Id);

    assert.ok(evidenceAudit, 'Audit event for Evidence 1 must exist');
    const payload = JSON.parse(evidenceAudit.payloadJson);
    assert.equal(payload.sha256, expectedSha1, 'Audit event must record verified server SHA-256');
    assert.equal(payload.clientSha256Verified, true);
  });

  // -------------------------------------------------------------------------
  // Test 8: Locked assessment -> evidence mutation is rejected
  // -------------------------------------------------------------------------
  it('Test 8: Locked assessment rejects evidence upload', async () => {
    // Grade all criteria to passing
    const asmRes = await fetch(`${API_BASE}/assessments/${assessmentIdA}`);
    const asmData = await asmRes.json();

    for (const ca of asmData.assessment.criterionAssessments || []) {
      await fetch(`${API_BASE}/assessments/${assessmentIdA}/criteria/${ca.criterionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessorId: 'ASR-01',
          status: 'DEMONSTRATED',
          practicalMarks: ca.criterion.practicalMarks,
          theoryMarks: ca.criterion.theoryMarks,
          vivaMarks: ca.criterion.vivaMarks,
          assessorNote: 'Demonstrated competency',
          evidenceOpened: true
        })
      });
    }

    // Capture remaining practical tasks so sign-off passes
    for (const taskCode of ['T2', 'T4', 'T5']) {
      const formData = new FormData();
      const blob = new Blob([testImage1], { type: 'image/jpeg' });
      formData.append('file', blob, `${taskCode}.jpg`);
      formData.append('taskCode', taskCode);
      formData.append('assessorId', 'ASR-01');
      formData.append('clientSha256', expectedSha1);
      formData.append('capturedAtClient', new Date().toISOString());
      await fetch(`${API_BASE}/assessments/${assessmentIdA}/tasks/${taskCode}/evidence/upload`, {
        method: 'POST',
        body: formData
      });
    }

    // Finalize assessment
    const finRes = await fetch(`${API_BASE}/assessments/${assessmentIdA}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessorId: 'ASR-01',
        action: 'SIGN_OFF',
        requestedFinalDisposition: 'SUITABLE_FOR_SIGNOFF',
        rationale: 'Supervised physical demonstration complete.'
      })
    });
    assert.equal(finRes.status, 201);
    const finData = await finRes.json();
    assert.equal(finData.isLocked, true, 'Assessment must now be locked');

    // Attempt to upload evidence to locked assessment
    const formData = new FormData();
    const blob = new Blob([testImage1], { type: 'image/jpeg' });
    formData.append('file', blob, 'post_lock.jpg');
    formData.append('taskCode', 'T1');
    formData.append('assessorId', 'ASR-01');

    const lockedUploadRes = await fetch(`${API_BASE}/assessments/${assessmentIdA}/tasks/T1/evidence/upload`, {
      method: 'POST',
      body: formData
    });

    assert.equal(lockedUploadRes.status, 400, 'Upload to locked assessment must return 400 Bad Request');
    const lockedData = await lockedUploadRes.json();
    assert.match(lockedData.message, /LOCKED/i, 'Error message must state assessment is locked');
  });
});
