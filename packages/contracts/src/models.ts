import {
  WorkflowState,
  RecommendationOutcome,
  AssessorDecision,
  FinalDisposition,
  RPLPathway,
  ThresholdOperator,
  EducationLevel,
  EnrolmentStatus,
  ApplicantContextSource,
  EvidenceType,
  LocationStatus,
  ProctoringStatus,
  AssessmentComponentType,
  CriterionStatus,
  VerificationStatus
} from './enums.js';

export interface QualificationVersion {
  id: string;
  externalCode: string; // e.g., 'AMH/Q0301'
  title: string;        // e.g., 'Sewing Machine Operator'
  nsqfLevel: number;    // e.g., 3
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  version: string;      // e.g., '2.0'
  sourceUri: string;
  sourceChecksum: string;
  retrievedAt: string;
  verificationStatus: VerificationStatus;
  totalTheoryMarks: number;
  totalPracticalMarks: number;
  totalVivaMarks: number;
  totalMarks: number;
  passPercentage: number;
}

export interface NOS {
  id: string;
  code: string;
  title: string;
  description: string;
  qualificationVersionId: string;
  isMandatory: boolean;
  order: number;
}

export interface Criterion {
  id: string;
  code: string;
  text: string;
  mandatory: boolean;
  nosId: string;
  theoryMarks: number;
  practicalMarks: number;
  vivaMarks: number;
  projectMarks?: number;
  totalMarks: number;
  officialReferences?: string[];
  order: number;
}

export interface AssessmentComponent {
  type: AssessmentComponentType;
  maxMarks: number;
  qualifyingRule?: string;
  description?: string;
}

export interface AssessmentScheme {
  id: string;
  qualificationVersionId: string;
  version: string;
  components: AssessmentComponent[];
  aggregatePassPercentage: number;
  componentWisePassRules?: Record<string, number>;
  sourceUri?: string;
}

export interface AssessmentPolicy {
  id: string;
  pathway: RPLPathway;
  version: string;
  thresholdValue: number;
  thresholdOperator: ThresholdOperator;
  sourceReference: string;
  requiresOrientation: boolean;
  minOrientationHours: number;
  maxOrientationHours: number;
  batchCapMax: number;
  requiresPhysicalSupervision: boolean;
}

export interface Candidate {
  id: string;
  fullName: string;
  primaryLanguage: string;
  phone?: string;
  consentRecordedAt: string;
  consentVersion: string;
  highestFormalEducation: EducationLevel;
  currentEnrolment: EnrolmentStatus;
  educationContextVerified: boolean;
  applicantContextSource: ApplicantContextSource;
  educationEvidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExperienceStatement {
  id: string;
  candidateId: string;
  rawText: string;
  audioRecordingUrl?: string;
  detectedLanguage: string;
  normalizedSkills: string[];
  declaredTasks: string[];
  declaredTools: string[];
  declaredOutputs: string[];
  yearsExperience: number;
  source: 'VOICE' | 'TEXT' | 'GUIDED_CHOICE';
  createdAt: string;
}

export interface PathwayContextSnapshot {
  pathway: RPLPathway;
  highestFormalEducation: EducationLevel;
  currentEnrolment: EnrolmentStatus;
  educationContextVerified: boolean;
  applicantContextSource: ApplicantContextSource;
  thresholdValue: number;
  thresholdOperator: ThresholdOperator;
  policyVersion: string;
}

export interface AssessmentTask {
  id: string;
  taskCode: string; // e.g. T1, T2, T3, T4, T5
  title: string;
  candidateInstructions: string[];
  assessorInstructions: string[];
  safetyNotes: string[];
  conditions: string[];
  equipment: string[];
  expectedObservableActions: string[];
  evidenceRequirements: EvidenceType[];
  linkedCriteriaCodes: string[];
  captureTypes: EvidenceType[];
}

export interface Evidence {
  id: string;
  captureId: string;
  sessionId: string;
  assessmentId: string;
  candidateId: string;
  assessorId: string;
  siteId: string;
  taskCode: string;
  evidenceType: EvidenceType;
  fileUri: string;
  sha256: string;
  durationSeconds?: number;
  deviceId: string;
  evidenceVersion: number;
  
  // Timing & Clock
  capturedAtClient: string;
  capturedAtServer?: string;
  clientTimezone: string;
  clockSkewSeconds?: number;
  
  // Geolocation
  latitude?: number;
  longitude?: number;
  locationAccuracyMeters?: number;
  locationCapturedAt?: string;
  locationStatus: LocationStatus;
  mockLocationFlag: boolean;
  geolocationIntegrityFlag: boolean;

  // Proctoring
  proctoringStatus: ProctoringStatus;
  proctoringAttestedBy?: string;
  proctoringAttestedAt?: string;
  
  isSynced: boolean;
  createdAt: string;
}

export interface EvidenceTrace {
  id: string;
  evidenceId: string;
  criterionId: string;
  relationType: 'SUPPORTING' | 'REFUTING' | 'PARTIAL';
  createdBy: 'AI' | 'ASSESSOR';
  assessorApproved: boolean;
  createdAt: string;
}

export interface AIObservation {
  id: string;
  modelRunId: string;
  criterionId: string;
  evidenceRefs: Array<{
    evidenceId: string;
    timestampStart?: number;
    timestampEnd?: number;
  }>;
  observation: string;
  confidence: number;
  suggestedAssessment: CriterionStatus;
  suggestedMark: number | null;
  suggestedMarkBasis: 'OFFICIAL_ASSESSMENT_SCHEME' | 'ANCHOR_ONLY';
  rationale: string;
  assessorAction?: 'ACCEPTED' | 'EDITED' | 'REJECTED';
  editedMark?: number | null;
  assessorComment?: string;
  actionTakenAt?: string;
  createdAt: string;
}

export interface CriterionAssessment {
  id: string;
  assessmentId: string;
  criterionId: string;
  assessorId: string;
  status: CriterionStatus;
  theoryMarks: number;
  practicalMarks: number;
  vivaMarks: number;
  totalAwardedMarks: number;
  assessorNote?: string;
  evidenceOpened: boolean;
  hasConflict: boolean;
  updatedAt: string;
}

export interface ScoreSnapshot {
  id: string;
  assessmentId: string;
  theoryScore: number;
  practicalScore: number;
  vivaScore: number;
  totalScore: number;
  maxScore: number;
  scorePercentage: number;
  componentTotals: Record<AssessmentComponentType, { max: number; awarded: number }>;
  qualifyingRulePassed: boolean;
  calculatedAt: string;
  isAuthoritative: boolean;
}

export interface CompetencyProfile {
  qualificationCode: string;
  qualificationTitle: string;
  qualificationVersion: string;
  nsqfLevel: number;
  rplPathway: RPLPathway;
  mappedExperientialCoverage: number;
  assessedCoverage: number;
  demonstratedCoverage: number;
  mandatoryCriteriaCount: number;
  mandatoryCriteriaSatisfied: number;
  mandatoryCriteriaPass: boolean;
  nosBreakdown: Array<{
    nosCode: string;
    nosTitle: string;
    criteriaCount: number;
    demonstratedCount: number;
    partialCount: number;
    notDemonstratedCount: number;
    status: 'DEMONSTRATED' | 'PARTIAL' | 'NOT_DEMONSTRATED';
  }>;
  score: ScoreSnapshot;
  recommendationOutcome: RecommendationOutcome;
}

export interface RecommendationSnapshot {
  id: string;
  assessmentId: string;
  workflowState: WorkflowState;
  systemOutcome: RecommendationOutcome;
  pathway: RPLPathway;
  mappedCoverage: number;
  assessedCoverage: number;
  demonstratedCoverage: number;
  mandatoryCriteriaPass: boolean;
  minimumPassRulePass: boolean;
  evidenceComplete: boolean;
  unresolvedCriteriaCount: number;
  policyVersion: string;
  generatedAt: string;
}

export interface AssessorDecisionRecord {
  id: string;
  assessmentId: string;
  assessorId: string;
  decision: AssessorDecision;
  finalDisposition?: FinalDisposition;
  reasonCode?: string;
  rationale: string;
  timestamp: string;
  signatureChecksum?: string;
}

export interface AuditEvent {
  id: string;
  assessmentId?: string;
  actorId: string;
  actorRole: string;
  eventType: string;
  entityType: string;
  entityId: string;
  beforeHash?: string;
  afterHash?: string;
  payloadJson: string;
  clientTimestamp?: string;
  serverTimestamp: string;
}

export interface Site {
  siteId: string;
  name: string;
  siteType: 'FIXED_CENTER' | 'PORTABLE_CAMP' | 'WORKPLACE';
  equipmentProfile: string[];
  environmentProfile: string;
  networkProfile: 'OFFLINE_PRIMARY' | 'INTERMITTENT' | 'HIGH_SPEED';
  geolocationPolicyVersion: string;
  siteLatitude: number;
  siteLongitude: number;
  locationAccuracyMeters: number;
  locationSource: 'GPS' | 'NETWORK' | 'MANUAL' | 'UNAVAILABLE';
}
