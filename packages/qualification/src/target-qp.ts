import {
  QualificationVersion,
  NOS,
  Criterion,
  AssessmentScheme,
  AssessmentPolicy,
  AssessmentTask,
  RPLPathway,
  ThresholdOperator,
  AssessmentComponentType,
  VerificationStatus,
  EvidenceType
} from '@sih26242/contracts';

export const SEWING_MACHINE_OPERATOR_QP: QualificationVersion = {
  id: 'qp-amh-q0301-v2',
  externalCode: 'AMH/Q0301',
  title: 'Sewing Machine Operator',
  nsqfLevel: 3,
  status: 'ACTIVE',
  version: '2.0',
  sourceUri: 'https://nqr.gov.in/sites/default/files/AMH_Q0301_v2.0%20Sewing%20Machine%20Operator.pdf',
  sourceChecksum: 'f7075af7be859f7fc894167dd11b0357e928c653a46a9d8e2769a52e87d08acb',
  retrievedAt: '2026-10-03T15:28:34.000Z',
  verificationStatus: VerificationStatus.VERIFIED, // Classified as SOURCE-BACKED DEVELOPER FIXTURE in reports/UI
  totalTheoryMarks: 106,
  totalPracticalMarks: 246,
  totalVivaMarks: 48,
  totalMarks: 400,
  passPercentage: 70
};

export const SEWING_MACHINE_OPERATOR_NOS: NOS[] = [
  {
    id: 'nos-amh-n0301',
    code: 'AMH/N0301',
    title: 'Carry out stitching activities using machine',
    description: 'Operate industrial sewing machine to stitch garment components conforming to production quality standards.',
    qualificationVersionId: 'qp-amh-q0301-v2',
    isMandatory: true,
    order: 1
  },
  {
    id: 'nos-amh-n0302',
    code: 'AMH/N0302',
    title: 'Contribute to achieve product quality in stitching operations',
    description: 'Inspect cut panels, check sewing tension, identify stitch defects and carry out basic alteration/rectification.',
    qualificationVersionId: 'qp-amh-q0301-v2',
    isMandatory: true,
    order: 2
  },
  {
    id: 'nos-amh-n0102',
    code: 'AMH/N0102',
    title: 'Maintain health, safety and security at workplace with gender and PwD sensitization',
    description: 'Comply with ergonomic posture, safety guards, emergency shut-off, and hazard reporting protocols.',
    qualificationVersionId: 'qp-amh-q0301-v2',
    isMandatory: true,
    order: 3
  },
  {
    id: 'nos-amh-n0103',
    code: 'AMH/N0103',
    title: 'Maintain work area, tools and machines',
    description: 'Clean and lubricate machine, replace worn needles, manage bobbin tension and keep workstation orderly.',
    qualificationVersionId: 'qp-amh-q0301-v2',
    isMandatory: true,
    order: 4
  },
  {
    id: 'nos-amh-n0104',
    code: 'AMH/N0104',
    title: 'Comply with industry and organizational requirements',
    description: 'Comply with organizational standard operating procedures, documentation, and reporting requirements.',
    qualificationVersionId: 'qp-amh-q0301-v2',
    isMandatory: true,
    order: 5
  }
];

export const SEWING_MACHINE_OPERATOR_CRITERIA: Criterion[] = [
  // NOS 1: AMH/N0301 Stitching Activities (Theory: 35, Practical: 130, Viva: 20 = Total 185)
  {
    id: 'crit-c01',
    code: 'PC 1.1',
    text: 'Inspect fabric cut panels for grain line, notches, and shading matching before stitching.',
    mandatory: true,
    nosId: 'nos-amh-n0301',
    theoryMarks: 6,
    practicalMarks: 20,
    vivaMarks: 4,
    totalMarks: 30,
    order: 1
  },
  {
    id: 'crit-c02',
    code: 'PC 1.2',
    text: 'Thread the sewing machine needle and bobbin correctly with proper tension regulation.',
    mandatory: true,
    nosId: 'nos-amh-n0301',
    theoryMarks: 8,
    practicalMarks: 30,
    vivaMarks: 4,
    totalMarks: 42,
    order: 2
  },
  {
    id: 'crit-c03',
    code: 'PC 1.3',
    text: 'Align material edges accurately and sew seams conforming to specified SPI (Stitches Per Inch) and tolerance.',
    mandatory: true,
    nosId: 'nos-amh-n0301',
    theoryMarks: 12,
    practicalMarks: 50,
    vivaMarks: 8,
    totalMarks: 70,
    order: 3
  },
  {
    id: 'crit-c04',
    code: 'PC 1.4',
    text: 'Execute back-tack / reverse stitching at start and end of seams to lock threads securely.',
    mandatory: false,
    nosId: 'nos-amh-n0301',
    theoryMarks: 9,
    practicalMarks: 30,
    vivaMarks: 4,
    totalMarks: 43,
    order: 4
  },

  // NOS 2: AMH/N0302 Quality (Theory: 25, Practical: 55, Viva: 10 = Total 90)
  {
    id: 'crit-c05',
    code: 'PC 2.1',
    text: 'Inspect stitched garments for skipped stitches, thread breakage, puckering, and uneven seam width.',
    mandatory: true,
    nosId: 'nos-amh-n0302',
    theoryMarks: 13,
    practicalMarks: 30,
    vivaMarks: 5,
    totalMarks: 48,
    order: 5
  },
  {
    id: 'crit-c06',
    code: 'PC 2.2',
    text: 'Perform alteration/unpicking and resewing cleanly without damaging the base fabric.',
    mandatory: false,
    nosId: 'nos-amh-n0302',
    theoryMarks: 12,
    practicalMarks: 25,
    vivaMarks: 5,
    totalMarks: 42,
    order: 6
  },

  // NOS 3: AMH/N0102 Health & Safety (Theory: 20, Practical: 25, Viva: 10 = Total 55)
  {
    id: 'crit-c07',
    code: 'PC 3.1',
    text: 'Ensure eye guard, finger guard and pulley safety belt covers are securely in place before switching on machine.',
    mandatory: true,
    nosId: 'nos-amh-n0102',
    theoryMarks: 10,
    practicalMarks: 15,
    vivaMarks: 5,
    totalMarks: 30,
    order: 7
  },
  {
    id: 'crit-c08',
    code: 'PC 3.2',
    text: 'Demonstrate proper ergonomic seated posture, foot pedal control and emergency machine shut-down.',
    mandatory: true,
    nosId: 'nos-amh-n0102',
    theoryMarks: 10,
    practicalMarks: 10,
    vivaMarks: 5,
    totalMarks: 25,
    order: 8
  },

  // NOS 4: AMH/N0103 Maintenance & Tools (Theory: 16, Practical: 24, Viva: 5 = Total 45)
  {
    id: 'crit-c09',
    code: 'PC 4.1',
    text: 'Clean machine bed, shuttle hook and feed dog lint before and after operations, and apply lubricating oil.',
    mandatory: false,
    nosId: 'nos-amh-n0103',
    theoryMarks: 8,
    practicalMarks: 14,
    vivaMarks: 3,
    totalMarks: 25,
    order: 9
  },
  {
    id: 'crit-c10',
    code: 'PC 4.2',
    text: 'Identify and replace bent or blunt needles with correct needle size and point type for the fabric.',
    mandatory: false,
    nosId: 'nos-amh-n0103',
    theoryMarks: 8,
    practicalMarks: 10,
    vivaMarks: 2,
    totalMarks: 20,
    order: 10
  },

  // NOS 5: AMH/N0104 Industry & Org Compliance (Theory: 10, Practical: 12, Viva: 3 = Total 25)
  {
    id: 'crit-c11',
    code: 'PC 5.1',
    text: 'Comply with reporting procedures, documentation, and organizational standard operating procedures.',
    mandatory: false,
    nosId: 'nos-amh-n0104',
    theoryMarks: 5,
    practicalMarks: 6,
    vivaMarks: 1,
    totalMarks: 12,
    order: 11
  },
  {
    id: 'crit-c12',
    code: 'PC 5.2',
    text: 'Follow confidentiality, ethical conduct, and workplace guidelines.',
    mandatory: false,
    nosId: 'nos-amh-n0104',
    theoryMarks: 5,
    practicalMarks: 6,
    vivaMarks: 2,
    totalMarks: 13,
    order: 12
  }
];

export const SEWING_MACHINE_OPERATOR_SCHEME: AssessmentScheme = {
  id: 'scheme-amh-q0301-v2',
  qualificationVersionId: 'qp-amh-q0301-v2',
  version: '2.0',
  components: [
    {
      type: AssessmentComponentType.THEORY,
      maxMarks: 106,
      qualifyingRule: '>= 50%'
    },
    {
      type: AssessmentComponentType.PRACTICAL,
      maxMarks: 246,
      qualifyingRule: '>= 60%'
    },
    {
      type: AssessmentComponentType.VIVA,
      maxMarks: 48,
      qualifyingRule: '>= 50%'
    }
  ],
  aggregatePassPercentage: 70
};

export const RPL_A_POLICY: AssessmentPolicy = {
  id: 'policy-rpl-a-2024-v1',
  pathway: RPLPathway.RPL_A,
  version: '2024.1',
  thresholdValue: 70,
  thresholdOperator: ThresholdOperator.GREATER_THAN_OR_EQUAL,
  sourceReference: 'NCVET RPL Gazette June 19, 2024 Stage 3 Table, PDF p.39',
  requiresOrientation: true,
  minOrientationHours: 12,
  maxOrientationHours: 15,
  batchCapMax: 30,
  requiresPhysicalSupervision: true
};

export const SEWING_MACHINE_OPERATOR_TASKS: AssessmentTask[] = [
  {
    id: 'task-t1',
    taskCode: 'T1',
    title: 'Preparation, Machine Threading and Needle Inspection',
    candidateInstructions: [
      'Inspect the provided sewing needle and fabric cut pieces.',
      'Thread the upper spool and wind/insert the lower bobbin.',
      'Perform a test seam on a scrap fabric piece.'
    ],
    assessorInstructions: [
      'Observe thread path accuracy and tension dial adjustment.',
      'Verify needle guard position and bobbin case placement.'
    ],
    safetyNotes: [
      'Ensure machine power switch is turned OFF while threading the needle.',
      'Check that finger guard is securely fastened.'
    ],
    conditions: ['Single needle lockstitch machine', 'Thread spool #40', 'Test fabric scraps'],
    equipment: ['Industrial Single Needle Lockstitch Machine', 'Thread snips', 'Spare needles (size 14/16)'],
    expectedObservableActions: [
      'Inspects needle for bluntness or burrs',
      'Threads needle eye from left to right correctly',
      'Adjusts tension regulator dial to test balanced stitch'
    ],
    evidenceRequirements: [EvidenceType.IMAGE, EvidenceType.NOTE],
    linkedCriteriaCodes: ['PC 1.1', 'PC 1.2', 'PC 4.2', 'PC 3.1'],
    captureTypes: [EvidenceType.IMAGE, EvidenceType.NOTE]
  },
  {
    id: 'task-t2',
    taskCode: 'T2',
    title: 'Safe Machine Startup and Stitching Setup',
    candidateInstructions: [
      'Turn on the machine motor switch.',
      'Demonstrate ergonomic seating posture and foot treadle balance.',
      'Check emergency power off switch.'
    ],
    assessorInstructions: [
      'Verify posture, safety guard clearance, and smooth speed control.'
    ],
    safetyNotes: ['Keep fingers at least 1 inch away from needle clamp while operating.'],
    conditions: ['Well-lit work area', 'Ear protection if motor noise exceeds 85dB'],
    equipment: ['Adjustable operator chair', 'Machine safety belt cover'],
    expectedObservableActions: [
      'Turns on power switch and listens for motor sound',
      'Assumes ergonomic upright posture with both feet balanced on treadle',
      'Tests emergency shut-off stop'
    ],
    evidenceRequirements: [EvidenceType.VIDEO],
    linkedCriteriaCodes: ['PC 3.1', 'PC 3.2'],
    captureTypes: [EvidenceType.VIDEO]
  },
  {
    id: 'task-t3',
    taskCode: 'T3',
    title: 'Core Production: Seam Assembly and Stitches Per Inch',
    candidateInstructions: [
      'Align the two main garment panel edges notch-to-notch.',
      'Sew a continuous 30cm seam maintaining 1/2-inch seam allowance.',
      'Lock seam ends with back-tack reverse stitching.'
    ],
    assessorInstructions: [
      'Record short video of continuous stitching action.',
      'Check edge alignment consistency and reverse lock stitching.'
    ],
    safetyNotes: ['Do not look away while machine needle is in motion.'],
    conditions: ['Production cut panels', 'Matching poly-wrap thread'],
    equipment: ['Lockstitch machine', 'Fabric guide gauge'],
    expectedObservableActions: [
      'Aligns two material edges before stitching',
      'Performs 3-4 reverse stitches at start and finish',
      'Maintains consistent seam guide distance'
    ],
    evidenceRequirements: [EvidenceType.VIDEO, EvidenceType.IMAGE],
    linkedCriteriaCodes: ['PC 1.3', 'PC 1.4'],
    captureTypes: [EvidenceType.VIDEO, EvidenceType.IMAGE]
  },
  {
    id: 'task-t4',
    taskCode: 'T4',
    title: 'Quality Finishing, Inspection and Defect Detection',
    candidateInstructions: [
      'Inspect finished seam against quality parameters.',
      'Trim all loose threads cleanly using snips.',
      'Report any identified stitch defects (puckering, skipped stitches).'
    ],
    assessorInstructions: [
      'Measure SPI with ruler (target 10-12 SPI).',
      'Examine seam tension and appearance for puckering or uneven width.'
    ],
    safetyNotes: ['Hold snips pointing downwards when not cutting.'],
    conditions: ['Inspection table with adequate light'],
    equipment: ['Measuring tape/ruler', 'Thread snips'],
    expectedObservableActions: [
      'Trims threads flush to fabric',
      'Checks seam under light for tension balance',
      'Points out any puckering or skipped stitches'
    ],
    evidenceRequirements: [EvidenceType.IMAGE, EvidenceType.NOTE],
    linkedCriteriaCodes: ['PC 2.1', 'PC 2.2'],
    captureTypes: [EvidenceType.IMAGE, EvidenceType.NOTE]
  },
  {
    id: 'task-t5',
    taskCode: 'T5',
    title: 'Machine Cleaning, Lint Removal and Workstation Tidying',
    candidateInstructions: [
      'Turn off machine power.',
      'Tilt machine head and brush out lint from bobbin case and feed dog.',
      'Wipe down table surface and store tools properly.'
    ],
    assessorInstructions: [
      'Verify power is disconnected before cleaning.',
      'Check lint removal thoroughness and proper oiling point identification.'
    ],
    safetyNotes: ['Never clean under the needle plate while power is connected.'],
    conditions: ['Machine powered down'],
    equipment: ['Cleaning brush', 'Machine oil dispenser', 'Lint cloth'],
    expectedObservableActions: [
      'Switches off machine power plug before touching shuttle hook',
      'Brushes out lint and thread debris from hook race',
      'Leaves workstation tidy and tools in tray'
    ],
    evidenceRequirements: [EvidenceType.IMAGE, EvidenceType.NOTE],
    linkedCriteriaCodes: ['PC 4.1', 'PC 5.1', 'PC 5.2'],
    captureTypes: [EvidenceType.IMAGE, EvidenceType.NOTE]
  }
];

export const DISTRACTOR_QUALIFICATIONS: QualificationVersion[] = [
  {
    id: 'qp-amh-q1001-v2',
    externalCode: 'AMH/Q1001',
    title: 'Hand Embroiderer',
    nsqfLevel: 3,
    status: 'ACTIVE',
    version: '2.0',
    sourceUri: 'https://nqr.gov.in/sites/default/files/AMH_Q1001_v2.0.pdf',
    sourceChecksum: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    retrievedAt: '2026-10-01T00:00:00.000Z',
    verificationStatus: VerificationStatus.VERIFIED,
    totalTheoryMarks: 100,
    totalPracticalMarks: 200,
    totalVivaMarks: 50,
    totalMarks: 350,
    passPercentage: 70
  },
  {
    id: 'qp-amh-q1947-v2',
    externalCode: 'AMH/Q1947',
    title: 'Self Employed Tailor',
    nsqfLevel: 4,
    status: 'ACTIVE',
    version: '2.0',
    sourceUri: 'https://nqr.gov.in/sites/default/files/AMH_Q1947_v2.0.pdf',
    sourceChecksum: 'b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01',
    retrievedAt: '2026-10-01T00:00:00.000Z',
    verificationStatus: VerificationStatus.VERIFIED,
    totalTheoryMarks: 120,
    totalPracticalMarks: 240,
    totalVivaMarks: 60,
    totalMarks: 420,
    passPercentage: 70
  },
  {
    id: 'qp-ele-q6001-v2',
    externalCode: 'ELE/Q6001',
    title: 'Assistant Electrician',
    nsqfLevel: 3,
    status: 'ACTIVE',
    version: '2.0',
    sourceUri: 'https://nqr.gov.in/sites/default/files/ELE_Q6001_v2.0.pdf',
    sourceChecksum: 'c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef012',
    retrievedAt: '2026-10-01T00:00:00.000Z',
    verificationStatus: VerificationStatus.VERIFIED,
    totalTheoryMarks: 100,
    totalPracticalMarks: 250,
    totalVivaMarks: 50,
    totalMarks: 400,
    passPercentage: 70
  }
];
