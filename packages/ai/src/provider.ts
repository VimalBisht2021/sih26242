import {
  TranscriptionRequest,
  TranscriptionResponse,
  AnalyzeEvidenceRequest,
  AnalyzeEvidenceResponse,
  QualificationMappingResponse,
  EvidenceObservationClaim,
  CriterionStatus
} from '@sih26242/contracts';
import { buildModelGovernanceRecord } from './governance.js';
import { validateAIObservation } from './validator.js';

export interface AIProvider {
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResponse>;
  analyzeEvidence(request: AnalyzeEvidenceRequest): Promise<AnalyzeEvidenceResponse>;
  mapExperience(rawExperience: string, language: string): Promise<QualificationMappingResponse>;
}

export class MockAIProvider implements AIProvider {
  private isChallengeMode: boolean = false;

  constructor(challengeMode: boolean = false) {
    this.isChallengeMode = challengeMode;
  }

  setChallengeMode(enabled: boolean) {
    this.isChallengeMode = enabled;
  }

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const transcript =
      'Main pichle 7 saal se industrial single needle lockstitch machine par stitching ka kaam kar rahi hoon. Main garment panel matching, seam alignment aur defect inspection acche se janti hoon.';
    
    const responsePayload = {
      transcript,
      detectedLanguage: 'hi',
      confidence: 0.94,
      segments: [
        { start: 0.0, end: 4.5, text: 'Main pichle 7 saal se industrial single needle lockstitch machine par stitching ka kaam kar rahi hoon.' },
        { start: 4.6, end: 9.8, text: 'Main garment panel matching, seam alignment aur defect inspection acche se janti hoon.' }
      ]
    };

    const governance = buildModelGovernanceRecord({
      modelName: 'whisper-hindi-multilingual',
      modelVersion: 'v3.1-large',
      promptVersion: 'stt-rpl-hi-v1',
      qualificationSourceId: 'AMH/Q0301',
      qualificationChecksum: 'f7075af7be859f7fc894167dd11b0357e928c653a46a9d8e2769a52e87d08acb',
      assessmentSchemeVersion: '2.0',
      assessmentPolicyVersion: '2024.1',
      retrievedPassageIds: [],
      inputPayload: request,
      outputPayload: responsePayload
    });

    return {
      ...responsePayload,
      governance
    };
  }

  async analyzeEvidence(request: AnalyzeEvidenceRequest): Promise<AnalyzeEvidenceResponse> {
    let claims: EvidenceObservationClaim[] = [];
    const missingEvidenceFlags: Array<{ criterionId: string; criterionCode: string; reason: string }> = [];

    const getCriterionMark = (criterionId: string, defaultOfficialMark?: number): { mark: number | null; basis: 'OFFICIAL_ASSESSMENT_SCHEME' | 'ANCHOR_ONLY' } => {
      const matched = request.applicableCriteria?.find(c => c.criterionId === criterionId);
      if (matched && typeof matched.maxPracticalMarks === 'number' && matched.maxPracticalMarks > 0) {
        return { mark: matched.maxPracticalMarks, basis: 'OFFICIAL_ASSESSMENT_SCHEME' };
      }
      if (defaultOfficialMark !== undefined && defaultOfficialMark > 0) {
        return { mark: defaultOfficialMark, basis: 'OFFICIAL_ASSESSMENT_SCHEME' };
      }
      return { mark: null, basis: 'ANCHOR_ONLY' };
    };

    // Realistic grounded observations for Sewing Machine Operator tasks
    if (request.taskCode === 'T3') {
      // Seam Assembly task: PC 1.3 (50 marks practical in official QP) and PC 1.4 (30 marks practical)
      const c03Score = getCriterionMark('crit-c03', 50);
      claims.push({
        criterionId: 'crit-c03', // PC 1.3: Seam alignment and SPI
        evidenceRefs: [{ evidenceId: request.evidenceId, timestampStart: 12.0, timestampEnd: 24.5 }],
        observation: 'Candidate aligns both material edges notch-to-notch before lowering presser foot and sewing a straight seam.',
        confidence: 0.88,
        suggestedAssessment: CriterionStatus.DEMONSTRATED,
        suggestedMark: c03Score.mark,
        suggestedMarkBasis: c03Score.basis,
        rationale: 'Observed continuous seam with consistent 1/2-inch allowance conforming to official rubric criteria.'
      });

      const c04Score = getCriterionMark('crit-c04', 30);
      claims.push({
        criterionId: 'crit-c04', // PC 1.4: Reverse lockstitch
        evidenceRefs: [{ evidenceId: request.evidenceId, timestampStart: 25.0, timestampEnd: 29.2 }],
        observation: 'Candidate uses reverse lever to execute back-tack lockstitches at the conclusion of the seam.',
        confidence: 0.92,
        suggestedAssessment: CriterionStatus.DEMONSTRATED,
        suggestedMark: c04Score.mark,
        suggestedMarkBasis: c04Score.basis,
        rationale: 'Back-tack stitch visible locking thread securely.'
      });
    } else if (request.taskCode === 'T2') {
      // Setup & Safety (PC 3.1: 15 marks practical in official QP AMH/N0102)
      const c07Score = getCriterionMark('crit-c07', 15);
      claims.push({
        criterionId: 'crit-c07',
        evidenceRefs: [{ evidenceId: request.evidenceId, timestampStart: 2.0, timestampEnd: 8.0 }],
        observation: 'Finger guard and eye guard inspected and confirmed properly secured before motor power switch toggled.',
        confidence: 0.95,
        suggestedAssessment: CriterionStatus.DEMONSTRATED,
        suggestedMark: c07Score.mark,
        suggestedMarkBasis: c07Score.basis,
        rationale: 'Clear view of safety guards positioned according to workplace standards.'
      });
    } else {
      // Default observation derived from supplied applicable criteria
      const firstCrit = request.applicableCriteria?.[0];
      const defaultScore = firstCrit && typeof firstCrit.maxPracticalMarks === 'number' && firstCrit.maxPracticalMarks > 0
        ? { mark: firstCrit.maxPracticalMarks, basis: 'OFFICIAL_ASSESSMENT_SCHEME' as const }
        : { mark: null, basis: 'ANCHOR_ONLY' as const };

      claims.push({
        criterionId: firstCrit?.criterionId || 'crit-c01',
        evidenceRefs: [{ evidenceId: request.evidenceId, timestampStart: 0.0, timestampEnd: 5.0 }],
        observation: 'Candidate demonstrates verified task sequence in supervised physical environment.',
        confidence: 0.85,
        suggestedAssessment: CriterionStatus.DEMONSTRATED,
        suggestedMark: defaultScore.mark,
        suggestedMarkBasis: defaultScore.basis,
        rationale: 'Demonstrated actions conform to observable checklist.'
      });
    }

    // Controlled perturbation for Automation Bias Challenge Mode (Section 36)
    if (this.isChallengeMode) {
      claims = claims.map(c => ({
        ...c,
        observation: '[CHALLENGE PERTURBATION] ' + c.observation + ' (Contradicts actual video footage).',
        confidence: 0.45,
        suggestedMark: c.suggestedMark !== null ? c.suggestedMark + 10 : 10, // Intentionally inflated!
        rationale: 'Intentionally perturbed AI claim for automation bias testing.'
      }));
    }

    // Validate every claim against grounding invariants
    for (const claim of claims) {
      const val = validateAIObservation(claim);
      if (!val.isValid) {
        throw new Error(`AI observation failed grounding validation: ${val.errors.join(', ')}`);
      }
    }

    const governance = buildModelGovernanceRecord({
      modelName: this.isChallengeMode ? 'vision-rubric-challenge-v1' : 'vision-rubric-grounded-v2',
      modelVersion: '2.4.0',
      promptVersion: 'rpl-amh-q0301-v2',
      qualificationSourceId: 'AMH/Q0301',
      qualificationChecksum: 'f7075af7be859f7fc894167dd11b0357e928c653a46a9d8e2769a52e87d08acb',
      assessmentSchemeVersion: '2.0',
      assessmentPolicyVersion: '2024.1',
      retrievedPassageIds: ['NOS-AMH/N0301', 'TASK-T3'],
      inputPayload: request,
      outputPayload: { claims, missingEvidenceFlags }
    });

    return {
      claims,
      missingEvidenceFlags,
      governance
    };
  }

  async mapExperience(rawExperience: string, language: string): Promise<QualificationMappingResponse> {
    const normalizedSkills = [
      'Industrial single needle lockstitch machine operation',
      'Garment assembly and panel alignment',
      'SPI tension regulation and seam quality inspection',
      'Needle replacement and basic lubrication maintenance',
      'Workplace safety guards and ergonomic posture'
    ];

    const topCandidates = [
      {
        qualificationCode: 'AMH/Q0301',
        qualificationTitle: 'Sewing Machine Operator',
        nsqfLevel: 3,
        relevanceScore: 0.88,
        rank: 1,
        matchedSkills: ['machine operation', 'garment assembly', 'seam inspection'],
        matchedTasks: ['Lockstitch operation', 'Edge alignment', 'Thread tension adjustment'],
        sources: ['Worker experience statement: 7 years stitching garments'],
        nosReferences: ['AMH/N0301', 'AMH/N0302', 'AMH/N0304']
      },
      {
        qualificationCode: 'AMH/Q1001',
        qualificationTitle: 'Hand Embroiderer',
        nsqfLevel: 3,
        relevanceScore: 0.71,
        rank: 2,
        matchedSkills: ['fabric handling', 'thread work', 'visual quality inspection'],
        matchedTasks: ['Fabric tension', 'Needle control'],
        sources: ['Worker experience statement: stitching skills'],
        nosReferences: ['AMH/N1001']
      },
      {
        qualificationCode: 'AMH/Q1947',
        qualificationTitle: 'Self Employed Tailor',
        nsqfLevel: 4,
        relevanceScore: 0.58,
        rank: 3,
        matchedSkills: ['garment stitching', 'alteration'],
        matchedTasks: ['Component joining', 'Unpicking and resewing'],
        sources: ['Worker experience statement: alteration'],
        nosReferences: ['AMH/N1947']
      },
      {
        qualificationCode: 'ELE/Q6001',
        qualificationTitle: 'Assistant Electrician',
        nsqfLevel: 3,
        relevanceScore: 0.12,
        rank: 4,
        matchedSkills: ['workplace safety'],
        matchedTasks: ['Power tool safety'],
        sources: ['General safety check'],
        nosReferences: ['ELE/N6001']
      }
    ];

    const governance = buildModelGovernanceRecord({
      modelName: 'hybrid-dense-sparse-qp-mapper',
      modelVersion: 'v2.1',
      promptVersion: 'mapping-multilingual-v2',
      qualificationSourceId: 'NQR-POOL-12',
      qualificationChecksum: 'pool-hash-2026',
      assessmentSchemeVersion: '2.0',
      assessmentPolicyVersion: '2024.1',
      retrievedPassageIds: ['QP-AMH/Q0301', 'QP-AMH/Q1001', 'QP-AMH/Q1947', 'QP-ELE/Q6001'],
      inputPayload: { rawExperience, language },
      outputPayload: { topCandidates, normalizedSkills }
    });

    return {
      topCandidates,
      normalizedSkills,
      governance
    };
  }

  async suggestScore(request: {
    criterionId: string;
    observation: string;
    maxPractical: number;
    maxTheory: number;
    maxViva: number;
  }) {
    return {
      suggestedAssessment: CriterionStatus.DEMONSTRATED,
      suggestedPracticalMarks: Math.round(request.maxPractical * 0.8),
      suggestedTheoryMarks: Math.round(request.maxTheory * 0.7),
      suggestedVivaMarks: Math.round(request.maxViva * 0.8),
      confidence: 0.88,
      rationale: 'Observed alignment with official rubric performance metrics.'
    };
  }
}

