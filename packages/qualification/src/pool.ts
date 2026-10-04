import { QualificationVersion, VerificationStatus } from '@sih26242/contracts';
import { SEWING_MACHINE_OPERATOR_QP } from './target-qp.js';

export const QUALIFICATION_POOL: QualificationVersion[] = [
  SEWING_MACHINE_OPERATOR_QP,

  // Distractor 1: Hand Embroiderer (Apparel, Level 3)
  {
    id: 'qp-amh-q1001-v2',
    externalCode: 'AMH/Q1001',
    title: 'Hand Embroiderer',
    nsqfLevel: 3,
    status: 'ACTIVE',
    version: '2.0',
    sourceUri: 'https://nqr.gov.in/qualifications/AMH-Q1001-v2.0.pdf',
    sourceChecksum: 'd41d8cd98f00b204e9800998ecf8427e',
    retrievedAt: '2026-10-03T00:00:00.000Z',
    verificationStatus: VerificationStatus.VERIFIED,
    totalTheoryMarks: 30,
    totalPracticalMarks: 50,
    totalVivaMarks: 20,
    totalMarks: 100,
    passPercentage: 70
  },

  // Distractor 2: Self Employed Tailor (Apparel, Level 4)
  {
    id: 'qp-amh-q1947-v2',
    externalCode: 'AMH/Q1947',
    title: 'Self Employed Tailor',
    nsqfLevel: 4,
    status: 'ACTIVE',
    version: '2.0',
    sourceUri: 'https://nqr.gov.in/qualifications/AMH-Q1947-v2.0.pdf',
    sourceChecksum: '79054025255fb1a26e4bc422aef54eb4',
    retrievedAt: '2026-10-03T00:00:00.000Z',
    verificationStatus: VerificationStatus.VERIFIED,
    totalTheoryMarks: 30,
    totalPracticalMarks: 50,
    totalVivaMarks: 20,
    totalMarks: 100,
    passPercentage: 70
  },

  // Distractor 3: Assistant Electrician (Electronics/Power, Level 3)
  {
    id: 'qp-ele-q6001-v2',
    externalCode: 'ELE/Q6001',
    title: 'Assistant Electrician',
    nsqfLevel: 3,
    status: 'ACTIVE',
    version: '2.0',
    sourceUri: 'https://nqr.gov.in/qualifications/ELE-Q6001-v2.0.pdf',
    sourceChecksum: 'b10a8db164e0754105b7a99be72e3fe5',
    retrievedAt: '2026-10-03T00:00:00.000Z',
    verificationStatus: VerificationStatus.VERIFIED,
    totalTheoryMarks: 30,
    totalPracticalMarks: 50,
    totalVivaMarks: 20,
    totalMarks: 100,
    passPercentage: 70
  },

  // Pool 5: Pattern Maker (Apparel, Level 4)
  {
    id: 'qp-amh-q0201-v2',
    externalCode: 'AMH/Q0201',
    title: 'Pattern Maker',
    nsqfLevel: 4,
    status: 'ACTIVE',
    version: '2.0',
    sourceUri: 'https://nqr.gov.in/qualifications/AMH-Q0201-v2.0.pdf',
    sourceChecksum: 'c4ca4238a0b923820dcc509a6f75849b',
    retrievedAt: '2026-10-03T00:00:00.000Z',
    verificationStatus: VerificationStatus.VERIFIED,
    totalTheoryMarks: 30,
    totalPracticalMarks: 50,
    totalVivaMarks: 20,
    totalMarks: 100,
    passPercentage: 70
  },

  // Pool 6: Fabric Checker (Apparel, Level 3)
  {
    id: 'qp-amh-q0401-v2',
    externalCode: 'AMH/Q0401',
    title: 'Fabric Checker',
    nsqfLevel: 3,
    status: 'ACTIVE',
    version: '2.0',
    sourceUri: 'https://nqr.gov.in/qualifications/AMH-Q0401-v2.0.pdf',
    sourceChecksum: 'c81e728d9d4c2f636f067f89cc14862c',
    retrievedAt: '2026-10-03T00:00:00.000Z',
    verificationStatus: VerificationStatus.VERIFIED,
    totalTheoryMarks: 30,
    totalPracticalMarks: 50,
    totalVivaMarks: 20,
    totalMarks: 100,
    passPercentage: 70
  },

  // Pool 7: Cutting Master (Apparel, Level 4)
  {
    id: 'qp-amh-q0501-v2',
    externalCode: 'AMH/Q0501',
    title: 'Cutting Master',
    nsqfLevel: 4,
    status: 'ACTIVE',
    version: '2.0',
    sourceUri: 'https://nqr.gov.in/qualifications/AMH-Q0501-v2.0.pdf',
    sourceChecksum: 'eccbc87e4b5ce2fe28308fd9f2a7baf3',
    retrievedAt: '2026-10-03T00:00:00.000Z',
    verificationStatus: VerificationStatus.VERIFIED,
    totalTheoryMarks: 30,
    totalPracticalMarks: 50,
    totalVivaMarks: 20,
    totalMarks: 100,
    passPercentage: 70
  },

  // Pool 8: General Mason (Construction, Level 3)
  {
    id: 'qp-con-q0102-v2',
    externalCode: 'CON/Q0102',
    title: 'General Mason',
    nsqfLevel: 3,
    status: 'ACTIVE',
    version: '2.0',
    sourceUri: 'https://nqr.gov.in/qualifications/CON-Q0102-v2.0.pdf',
    sourceChecksum: 'a87ff679a2f3e71d9181a67b7542122c',
    retrievedAt: '2026-10-03T00:00:00.000Z',
    verificationStatus: VerificationStatus.VERIFIED,
    totalTheoryMarks: 30,
    totalPracticalMarks: 50,
    totalVivaMarks: 20,
    totalMarks: 100,
    passPercentage: 70
  },

  // Pool 9: Bar Bender & Steel Fixer (Construction, Level 3)
  {
    id: 'qp-con-q0201-v2',
    externalCode: 'CON/Q0201',
    title: 'Bar Bender & Steel Fixer',
    nsqfLevel: 3,
    status: 'ACTIVE',
    version: '2.0',
    sourceUri: 'https://nqr.gov.in/qualifications/CON-Q0201-v2.0.pdf',
    sourceChecksum: 'e4da3b7fbbce2345d7772b0674a318d5',
    retrievedAt: '2026-10-03T00:00:00.000Z',
    verificationStatus: VerificationStatus.VERIFIED,
    totalTheoryMarks: 30,
    totalPracticalMarks: 50,
    totalVivaMarks: 20,
    totalMarks: 100,
    passPercentage: 70
  },

  // Pool 10: Assistant Manual Metal Arc Welder (Capital Goods, Level 2)
  {
    id: 'qp-csc-q0204-v2',
    externalCode: 'CSC/Q0204',
    title: 'Assistant Manual Metal Arc Welder',
    nsqfLevel: 2,
    status: 'ACTIVE',
    version: '2.0',
    sourceUri: 'https://nqr.gov.in/qualifications/CSC-Q0204-v2.0.pdf',
    sourceChecksum: '1679091c5a880faf6fb5e6087eb1b2dc',
    retrievedAt: '2026-10-03T00:00:00.000Z',
    verificationStatus: VerificationStatus.VERIFIED,
    totalTheoryMarks: 25,
    totalPracticalMarks: 55,
    totalVivaMarks: 20,
    totalMarks: 100,
    passPercentage: 70
  },

  // Pool 11: Field Technician - Other Home Appliances (Electronics, Level 4)
  {
    id: 'qp-ele-q3101-v2',
    externalCode: 'ELE/Q3101',
    title: 'Field Technician - Other Home Appliances',
    nsqfLevel: 4,
    status: 'ACTIVE',
    version: '2.0',
    sourceUri: 'https://nqr.gov.in/qualifications/ELE-Q3101-v2.0.pdf',
    sourceChecksum: '8f14e45fceea167a5a36dedd4bea2543',
    retrievedAt: '2026-10-03T00:00:00.000Z',
    verificationStatus: VerificationStatus.VERIFIED,
    totalTheoryMarks: 30,
    totalPracticalMarks: 50,
    totalVivaMarks: 20,
    totalMarks: 100,
    passPercentage: 70
  },

  // Pool 12: Export Executive (Apparel, Level 5)
  {
    id: 'qp-amh-q0101-v2',
    externalCode: 'AMH/Q0101',
    title: 'Export Executive',
    nsqfLevel: 5,
    status: 'ACTIVE',
    version: '2.0',
    sourceUri: 'https://nqr.gov.in/qualifications/AMH-Q0101-v2.0.pdf',
    sourceChecksum: 'c9f0f895fb98ab9159f51fd0297e236d',
    retrievedAt: '2026-10-03T00:00:00.000Z',
    verificationStatus: VerificationStatus.VERIFIED,
    totalTheoryMarks: 35,
    totalPracticalMarks: 45,
    totalVivaMarks: 20,
    totalMarks: 100,
    passPercentage: 70
  }
];
