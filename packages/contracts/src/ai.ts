import { CriterionStatus } from './enums.js';

export interface ModelGovernanceRecord {
  modelName: string;
  modelVersion: string;
  promptVersion: string;
  qualificationSourceId: string;
  qualificationChecksum: string;
  assessmentSchemeVersion: string;
  assessmentPolicyVersion: string;
  retrievedPassageIds: string[];
  inputHash: string;
  outputHash: string;
  executedAt: string;
}

export interface TranscriptionRequest {
  mediaUri: string;
  mediaSha256: string;
  languageHint?: string;
  candidateId: string;
}

export interface TranscriptionResponse {
  transcript: string;
  detectedLanguage: string;
  confidence: number;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  governance: ModelGovernanceRecord;
}

export interface AnalyzeEvidenceRequest {
  evidenceId: string;
  taskCode: string;
  mediaUri: string;
  mediaType: string;
  applicableCriteria: Array<{
    criterionId: string;
    code: string;
    text: string;
    maxPracticalMarks: number;
  }>;
}

export interface EvidenceObservationClaim {
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
}

export interface AnalyzeEvidenceResponse {
  claims: EvidenceObservationClaim[];
  missingEvidenceFlags: Array<{
    criterionId: string;
    criterionCode: string;
    reason: string;
  }>;
  governance: ModelGovernanceRecord;
}

export interface QualificationMappingCandidate {
  qualificationCode: string;
  qualificationTitle: string;
  nsqfLevel: number;
  relevanceScore: number;
  rank: number;
  matchedSkills: string[];
  matchedTasks: string[];
  sources: string[];
  nosReferences: string[];
}

export interface QualificationMappingResponse {
  topCandidates: QualificationMappingCandidate[];
  normalizedSkills: string[];
  governance: ModelGovernanceRecord;
}
