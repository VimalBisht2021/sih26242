import { prisma } from '@sih26242/database';
import {
  SEWING_MACHINE_OPERATOR_QP,
  SEWING_MACHINE_OPERATOR_NOS,
  SEWING_MACHINE_OPERATOR_CRITERIA,
  SEWING_MACHINE_OPERATOR_SCHEME,
  QUALIFICATION_POOL
} from '@sih26242/qualification';
import {
  WorkflowState,
  RPLPathway,
  RecommendationOutcome,
  AssessorDecision,
  FinalDisposition,
  CriterionStatus,
  EvidenceType,
  LocationStatus,
  ProctoringStatus
} from '@sih26242/contracts';
import { computeSha256 } from '@sih26242/shared';

async function seed() {
  console.log('--- SEEDING PS26242 RPL PLATFORM DATABASE ---');

  // 1. Seed Site
  const site = await prisma.site.upsert({
    where: { siteId: 'SITE-01' },
    update: {},
    create: {
      siteId: 'SITE-01',
      name: 'Delhi Okhla Apparel Skill Cluster - Center 4',
      siteType: 'FIXED_CENTER',
      equipmentProfile: [
        'Single Needle Lockstitch Machine',
        'Overlock Machine',
        'Fabric Shears',
        'Measuring Tape',
        'Trim Bin',
        'Safety Glasses'
      ],
      environmentProfile: 'WELL_LIT_FACTORY_FLOOR',
      networkProfile: 'INTERMITTENT_2G_4G',
      geolocationPolicyVersion: 'v1',
      siteLatitude: 28.5355,
      siteLongitude: 77.2732,
      locationAccuracyMeters: 8.5,
      locationSource: 'DEMO_FIXTURE'
    }
  });

  console.log(`[+] Seeded Site: ${site.name} (${site.siteId})`);

  // 2. Seed Target Qualification: Sewing Machine Operator (AMH/Q0301)
  const targetQ = await prisma.qualificationVersion.upsert({
    where: { id: SEWING_MACHINE_OPERATOR_QP.id },
    update: {
      externalCode: SEWING_MACHINE_OPERATOR_QP.externalCode,
      title: SEWING_MACHINE_OPERATOR_QP.title,
      nsqfLevel: SEWING_MACHINE_OPERATOR_QP.nsqfLevel,
      version: SEWING_MACHINE_OPERATOR_QP.version,
      status: 'ACTIVE',
      sourceUri: SEWING_MACHINE_OPERATOR_QP.sourceUri,
      sourceChecksum: SEWING_MACHINE_OPERATOR_QP.sourceChecksum,
      totalTheoryMarks: SEWING_MACHINE_OPERATOR_QP.totalTheoryMarks,
      totalPracticalMarks: SEWING_MACHINE_OPERATOR_QP.totalPracticalMarks,
      totalVivaMarks: SEWING_MACHINE_OPERATOR_QP.totalVivaMarks,
      totalMarks: SEWING_MACHINE_OPERATOR_QP.totalMarks,
      passPercentage: SEWING_MACHINE_OPERATOR_QP.passPercentage
    },
    create: {
      id: SEWING_MACHINE_OPERATOR_QP.id,
      externalCode: SEWING_MACHINE_OPERATOR_QP.externalCode,
      title: SEWING_MACHINE_OPERATOR_QP.title,
      nsqfLevel: SEWING_MACHINE_OPERATOR_QP.nsqfLevel,
      version: SEWING_MACHINE_OPERATOR_QP.version,
      status: 'ACTIVE',
      sourceUri: SEWING_MACHINE_OPERATOR_QP.sourceUri,
      sourceChecksum: SEWING_MACHINE_OPERATOR_QP.sourceChecksum,
      totalTheoryMarks: SEWING_MACHINE_OPERATOR_QP.totalTheoryMarks,
      totalPracticalMarks: SEWING_MACHINE_OPERATOR_QP.totalPracticalMarks,
      totalVivaMarks: SEWING_MACHINE_OPERATOR_QP.totalVivaMarks,
      totalMarks: SEWING_MACHINE_OPERATOR_QP.totalMarks,
      passPercentage: SEWING_MACHINE_OPERATOR_QP.passPercentage
    }
  });

  // Clean stale dependent records to ensure exact 5 compulsory NOS and 12 criteria are installed
  await prisma.aIObservation.deleteMany({});
  await prisma.evidenceTrace.deleteMany({});
  await prisma.criterionAssessment.deleteMany({});
  await prisma.scoreSnapshot.deleteMany({});
  await prisma.recommendationSnapshot.deleteMany({});
  await prisma.evidence.deleteMany({});
  await prisma.assessmentSession.deleteMany({});
  await prisma.auditEvent.deleteMany({});
  await prisma.assessment.deleteMany({
    where: { id: { in: ['ASM-DEMO-001', 'ASM-DEMO-002'] } }
  });
  await prisma.criterion.deleteMany({
    where: { qualificationVersionId: targetQ.id }
  });
  await prisma.nOS.deleteMany({
    where: { qualificationVersionId: targetQ.id }
  });

  // Seed NOS
  for (const n of SEWING_MACHINE_OPERATOR_NOS) {
    await prisma.nOS.upsert({
      where: { id: n.id },
      update: {},
      create: {
        id: n.id,
        code: n.code,
        title: n.title,
        description: n.description,
        qualificationVersionId: targetQ.id,
        isMandatory: n.isMandatory,
        order: n.order
      }
    });
  }

  // Seed Criteria
  for (const c of SEWING_MACHINE_OPERATOR_CRITERIA) {
    await prisma.criterion.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        code: c.code,
        text: c.text,
        mandatory: c.mandatory,
        nosId: c.nosId,
        qualificationVersionId: targetQ.id,
        theoryMarks: c.theoryMarks,
        practicalMarks: c.practicalMarks,
        vivaMarks: c.vivaMarks,
        totalMarks: c.totalMarks,
        order: c.order
      }
    });
  }

  // Seed Assessment Scheme
  await prisma.assessmentScheme.upsert({
    where: { id: SEWING_MACHINE_OPERATOR_SCHEME.id },
    update: {},
    create: {
      id: SEWING_MACHINE_OPERATOR_SCHEME.id,
      qualificationVersionId: targetQ.id,
      version: SEWING_MACHINE_OPERATOR_SCHEME.version,
      aggregatePassPercentage: SEWING_MACHINE_OPERATOR_SCHEME.aggregatePassPercentage,
      componentsJson: JSON.stringify(SEWING_MACHINE_OPERATOR_SCHEME.components)
    }
  });
  console.log(`[+] Seeded Target QP: ${targetQ.title} (${targetQ.externalCode}) with ${SEWING_MACHINE_OPERATOR_CRITERIA.length} criteria`);

  // 3. Seed Distractor Qualifications from Pool
  for (const q of QUALIFICATION_POOL) {
    await prisma.qualificationVersion.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        externalCode: q.externalCode,
        title: q.title,
        nsqfLevel: q.nsqfLevel,
        version: q.version,
        status: 'ACTIVE',
        sourceUri: q.sourceUri,
        sourceChecksum: q.sourceChecksum,
        totalTheoryMarks: q.totalTheoryMarks,
        totalPracticalMarks: q.totalPracticalMarks,
        totalVivaMarks: q.totalVivaMarks,
        passPercentage: q.passPercentage
      }
    });
  }
  console.log(`[+] Seeded ${QUALIFICATION_POOL.length} distractor qualifications for evaluation & mapping pool`);

  // Clean up prior transaction records for clean idempotent demo seeding
  await prisma.evidenceTrace.deleteMany({});
  await prisma.criterionAssessment.deleteMany({});
  await prisma.evidence.deleteMany({});
  await prisma.assessmentSession.deleteMany({});
  await prisma.scoreSnapshot.deleteMany({});
  await prisma.recommendationSnapshot.deleteMany({});
  await prisma.auditEvent.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.experienceStatement.deleteMany({});

  // 4. Seed Demo Candidates
  // Candidate 1: Ramesh Verma (Strong stitching experience, passes demonstration)
  const cand1 = await prisma.candidate.upsert({
    where: { id: 'CAND-01' },
    update: {},
    create: {
      id: 'CAND-01',
      fullName: 'Ramesh Verma',
      primaryLanguage: 'hi',
      phone: '+91-9876543210',
      highestFormalEducation: 'NONE',
      currentEnrolment: 'NONE',
      educationContextVerified: true,
      applicantContextSource: 'SELF_DECLARED',
      consentVersion: 'dpdp-2026-v1'
    }
  });

  await prisma.experienceStatement.create({
    data: {
      candidateId: cand1.id,
      rawText: 'मैं पिछले 4 साल से एक छोटे गारमेंट वर्कशॉप में सिलाई का काम कर रहा हूँ। मैं सिंगल नीडल लॉकस्टिच मशीन चलाता हूँ, कॉटन और पॉलिएस्टर फैब्रिक पर सिलाई करता हूँ, बॉबिन भरता हूँ और मशीन की सुई बदलते समय सुरक्षा गार्ड का ध्यान रखता हूँ।',
      detectedLanguage: 'hi',
      normalizedSkills: [
        'Single needle lockstitch machine operation',
        'Fabric alignment and feeding',
        'Bobbin winding and threading',
        'Needle replacement and safety guard check',
        'Straight and curved seam stitching'
      ],
      declaredTasks: ['Fabric alignment', 'Lockstitch sewing', 'Seam finishing', 'Safety inspection'],
      declaredTools: ['Single needle lockstitch machine', 'Fabric shears', 'Measuring tape', 'Thread snips'],
      declaredOutputs: ['Stitched shirt panels', 'Finished trouser seams'],
      yearsExperience: 4,
      source: 'VOICE_HINDI'
    }
  });
  console.log(`[+] Seeded Candidate 1: ${cand1.fullName} (Informal worker, 4 yrs exp)`);

  // Candidate 2: Sunita Devi (Informal worker, partial safety awareness, negative referral demonstration)
  const cand2 = await prisma.candidate.upsert({
    where: { id: 'CAND-02' },
    update: {},
    create: {
      id: 'CAND-02',
      fullName: 'Sunita Devi',
      primaryLanguage: 'hi',
      phone: '+91-9876543211',
      highestFormalEducation: 'FIFTH',
      currentEnrolment: 'NONE',
      educationContextVerified: true,
      applicantContextSource: 'SELF_DECLARED',
      consentVersion: 'dpdp-2026-v1'
    }
  });

  await prisma.experienceStatement.create({
    data: {
      candidateId: cand2.id,
      rawText: 'मैं घर पर 2 साल से लेडीज सूट और ब्लाउज की सिलाई करती हूँ। कभी-कभी धागा टूटता है या सिलाई टेढ़ी हो जाती है।',
      detectedLanguage: 'hi',
      normalizedSkills: ['Basic home sewing', 'Hand stitching', 'Fabric cutting'],
      declaredTasks: ['Basic stitching', 'Fabric cutting'],
      declaredTools: ['Domestic sewing machine', 'Scissors'],
      declaredOutputs: ['Simple blouses'],
      yearsExperience: 2,
      source: 'VOICE_HINDI'
    }
  });
  console.log(`[+] Seeded Candidate 2: ${cand2.fullName} (Negative referral test case)`);

  // Candidate 3: Priya Kumari (RPL-B candidate with formal ITI education)
  const cand3 = await prisma.candidate.upsert({
    where: { id: 'CAND-03' },
    update: {},
    create: {
      id: 'CAND-03',
      fullName: 'Priya Kumari',
      primaryLanguage: 'hi',
      phone: '+91-9876543212',
      highestFormalEducation: 'ITI',
      currentEnrolment: 'NONE',
      educationContextVerified: true,
      applicantContextSource: 'DOCUMENT_VERIFIED',
      consentVersion: 'dpdp-2026-v1'
    }
  });

  console.log(`[+] Seeded Candidate 3: ${cand3.fullName} (RPL-B formal ITI test case)`);

  // 5. Create a comprehensive, realistic seeded Assessment for Ramesh Verma (CAND-01)
  const assessment = await prisma.assessment.create({
    data: {
      id: 'ASM-DEMO-001',
      candidateId: cand1.id,
      qualificationVersionId: targetQ.id,
      assessorId: 'ASR-01',
      siteId: site.siteId,
      workflowState: WorkflowState.SIGNOFF_READY,
      rplPathway: RPLPathway.RPL_A,
      systemOutcome: RecommendationOutcome.SUITABLE_FOR_SIGNOFF,
      aiProposedMappedCoverage: 80.0,
      assessorConfirmedMappedCoverage: 80.0,
      coverageThresholdValue: 70,
      coverageThresholdOperator: '>=',
      policyVersion: '2024.1',
      schemeVersion: '2.0',
      orientationCompletedHours: 15
    }
  });

  // Seed Session
  const session = await prisma.assessmentSession.create({
    data: {
      sessionCode: 'SES-DEMO-001',
      assessmentId: assessment.id,
      assessorId: 'ASR-01',
      deviceId: 'demo-tablet-01',
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      proctoringAttested: true,
      proctoringAttestedAt: new Date(),
      clientTimezone: 'Asia/Kolkata',
      clockSkewSeconds: 2
    }
  });

  // Seed Evidence for 5 practical tasks
  const evidenceTasks = [
    { code: 'T1', type: EvidenceType.IMAGE, uri: '/media/demo/task1_prep.jpg', dur: null },
    { code: 'T2', type: EvidenceType.VIDEO, uri: '/media/demo/task2_safety.mp4', dur: 45.2 },
    { code: 'T3', type: EvidenceType.VIDEO, uri: '/media/demo/task3_stitching.mp4', dur: 120.0 },
    { code: 'T4', type: EvidenceType.IMAGE, uri: '/media/demo/task4_inspection.jpg', dur: null },
    { code: 'T5', type: EvidenceType.VIDEO, uri: '/media/demo/task5_problem_solving.mp4', dur: 62.5 }
  ];

  const createdEvidences: any[] = [];
  for (const et of evidenceTasks) {
    const ev = await prisma.evidence.create({
      data: {
        captureId: `CAP-${et.code}-${Date.now().toString(36)}`,
        sessionId: session.id,
        assessmentId: assessment.id,
        candidateId: cand1.id,
        assessorId: 'ASR-01',
        siteId: site.siteId,
        taskCode: et.code,
        evidenceType: et.type,
        fileUri: et.uri,
        sha256: computeSha256(`SEED-PAYLOAD-${et.code}`),
        durationSeconds: et.dur,
        deviceId: 'demo-tablet-01',
        capturedAtClient: new Date(Date.now() - 1800000),
        capturedAtServer: new Date(),
        clientTimezone: 'Asia/Kolkata',
        clockSkewSeconds: 2,
        latitude: 28.5355,
        longitude: 77.2732,
        locationAccuracyMeters: 6.2,
        locationStatus: LocationStatus.AVAILABLE,
        mockLocationFlag: false,
        geolocationIntegrityFlag: true,
        proctoringStatus: ProctoringStatus.VERIFIED,
        proctoringAttestedBy: 'ASR-01',
        proctoringAttestedAt: new Date(),
        isSynced: true
      }
    });
    createdEvidences.push(ev);
  }

  // Seed CriterionAssessments for all 12 criteria across 5 compulsory NOS of AMH/Q0301 v2.0
  const criteriaList = await prisma.criterion.findMany({
    where: { qualificationVersionId: targetQ.id },
    orderBy: { order: 'asc' }
  });

  // Award marks demonstrating a passing candidate under the official 400-mark scheme (376 / 400 = 94% >= 70%)
  for (let i = 0; i < criteriaList.length; i++) {
    const crit = criteriaList[i];
    // Give almost full practical and viva marks, passing all mandatory criteria
    const prac = crit.practicalMarks;
    const viva = crit.vivaMarks;
    const theory = Math.round(crit.theoryMarks * 0.75);
    const total = prac + viva + theory;

    const ca = await prisma.criterionAssessment.create({
      data: {
        assessmentId: assessment.id,
        criterionId: crit.id,
        assessorId: 'ASR-01',
        status: CriterionStatus.DEMONSTRATED,
        practicalMarks: prac,
        theoryMarks: theory,
        vivaMarks: viva,
        totalAwardedMarks: total,
        assessorNote: 'Observed standard adherence and correct handling in practical session.',
        evidenceOpened: true
      }
    });

    // Link evidence trace to relevant task evidence
    const evItem = createdEvidences[i % createdEvidences.length];
    await prisma.evidenceTrace.create({
      data: {
        evidenceId: evItem.id,
        criterionId: crit.id,
        relationType: 'SUPPORTING',
        createdBy: 'ASSESSOR',
        assessorApproved: true
      }
    });
  }

  console.log(`[+] Seeded Assessment for Ramesh Verma (ASM-DEMO-001) with 5 evidence items and ${criteriaList.length} evaluated criteria.`);

  // 6. Create realistic seeded Assessment for Sunita Devi (CAND-02) for Negative Referral demo
  const assessment2 = await prisma.assessment.create({
    data: {
      id: 'ASM-DEMO-002',
      candidateId: cand2.id,
      qualificationVersionId: targetQ.id,
      assessorId: 'ASR-01',
      siteId: site.siteId,
      workflowState: WorkflowState.ASSESSOR_DECISION_PENDING,
      rplPathway: RPLPathway.RPL_A,
      systemOutcome: RecommendationOutcome.UPSKILLING_REQUIRED,
      aiProposedMappedCoverage: 50.0,
      assessorConfirmedMappedCoverage: 50.0,
      coverageThresholdValue: 70,
      coverageThresholdOperator: '>=',
      policyVersion: '2024.1',
      schemeVersion: '2.0',
      orientationCompletedHours: 12
    }
  });

  await prisma.assessmentSession.create({
    data: {
      sessionCode: 'SES-DEMO-002',
      assessmentId: assessment2.id,
      assessorId: 'ASR-01',
      deviceId: 'demo-tablet-02',
      startedAt: new Date(Date.now() - 3600000),
      proctoringAttested: true,
      proctoringAttestedAt: new Date(),
      clientTimezone: 'Asia/Kolkata',
      clockSkewSeconds: 1
    }
  });

  // Seed failing marks for Candidate 2
  for (const crit of criteriaList) {
    await prisma.criterionAssessment.create({
      data: {
        assessmentId: assessment2.id,
        criterionId: crit.id,
        assessorId: 'ASR-01',
        status: CriterionStatus.NOT_DEMONSTRATED,
        practicalMarks: 0,
        theoryMarks: 0,
        vivaMarks: 0,
        totalAwardedMarks: 0,
        assessorNote: 'Candidate requires foundation skill upskilling.',
        evidenceOpened: false
      }
    });
  }
  console.log(`[+] Seeded Assessment for Sunita Devi (ASM-DEMO-002) for Negative Referral demo.`);
  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
