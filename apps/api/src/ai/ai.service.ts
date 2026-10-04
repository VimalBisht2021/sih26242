import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@sih26242/database';
import { MockAIProvider, validateAIObservation, buildModelGovernanceRecord } from '@sih26242/ai';
import { EvidenceObservationClaim } from '@sih26242/contracts';

export interface TranscribeDto {
  audioRecordingUrl?: string;
  rawBase64?: string;
  language?: string;
  candidateId?: string;
}

export interface AnalyzeEvidenceDto {
  evidenceId: string;
  evidenceUri: string;
  taskCode: string;
  applicableCriteriaIds: string[];
  candidateContext?: string;
}

export interface LinkEvidenceDto {
  observation: string;
  criterionId: string;
  evidenceId: string;
  timestampStart?: number;
  timestampEnd?: number;
}

export interface SuggestScoreDto {
  criterionId: string;
  observation: string;
  maxPracticalMarks: number;
  maxTheoryMarks: number;
  maxVivaMarks: number;
}

@Injectable()
export class AIService {
  private provider = new MockAIProvider();

  async transcribe(dto: TranscribeDto) {
    const lang = dto.language || 'hi';
    const result = await this.provider.transcribe({
      mediaUri: dto.audioRecordingUrl || 'mock://audio/sample.mp3',
      mediaSha256: 'mock-sha256-audio',
      candidateId: dto.candidateId || 'CAND-01',
      languageHint: lang
    });

    return {
      success: true,
      originalLanguage: lang,
      transcript: result.transcript,
      confidence: result.confidence,
      segments: result.segments,
      decisionOwnerNotice: 'Assessor must review and confirm before authoritative use.'
    };
  }

  async analyzeEvidence(dto: AnalyzeEvidenceDto) {
    const evidence = await prisma.evidence.findUnique({
      where: { id: dto.evidenceId }
    });

    const criteriaRecords = await prisma.criterion.findMany({
      where: { id: { in: dto.applicableCriteriaIds } }
    });

    const applicableCriteria = criteriaRecords.map(c => ({
      criterionId: c.id,
      code: c.code,
      text: c.text,
      maxPracticalMarks: c.practicalMarks
    }));

    const analysisResult = await this.provider.analyzeEvidence({
      evidenceId: dto.evidenceId,
      taskCode: dto.taskCode,
      mediaUri: dto.evidenceUri,
      mediaType: 'VIDEO',
      applicableCriteria
    });

    const modelRunId = `MOD-${Date.now().toString(36)}`;

    // Validate structured AI contract on all observations
    const validatedObservations: EvidenceObservationClaim[] = [];
    for (const obs of analysisResult.claims) {
      const validation = validateAIObservation(obs);

      if (validation.isValid) {
        validatedObservations.push(obs);

        // Record in database if criterion exists
        const critExists = await prisma.criterion.findUnique({
          where: { id: obs.criterionId }
        });

        if (critExists) {
          await prisma.aIObservation.create({
            data: {
              criterionId: obs.criterionId,
              modelRunId,
              evidenceRefsJson: JSON.stringify(obs.evidenceRefs),
              observation: obs.observation,
              confidence: obs.confidence,
              suggestedAssessment: obs.suggestedAssessment,
              suggestedMark: obs.suggestedMark,
              suggestedMarkBasis: obs.suggestedMarkBasis,
              rationale: obs.rationale
            }
          });
        }
      }
    }

    return {
      success: true,
      evidenceId: dto.evidenceId,
      taskCode: dto.taskCode,
      modelGovernance: analysisResult.governance,
      observations: validatedObservations,
      missingEvidenceFlags: analysisResult.missingEvidenceFlags,
      decisionOwnerNotice: 'AI CAN HELP. AI CANNOT CERTIFY. Assessor must accept, edit, or reject observations.'
    };
  }

  async linkEvidence(dto: LinkEvidenceDto) {

    const criterion = await prisma.criterion.findUnique({
      where: { id: dto.criterionId }
    });
    if (!criterion) {
      throw new BadRequestException(`Criterion ${dto.criterionId} not found.`);
    }

    const evidence = await prisma.evidence.findUnique({
      where: { id: dto.evidenceId }
    });
    if (!evidence) {
      throw new BadRequestException(`Evidence ${dto.evidenceId} not found.`);
    }

    const trace = await prisma.evidenceTrace.create({
      data: {
        evidenceId: dto.evidenceId,
        criterionId: dto.criterionId,
        relationType: 'SUPPORTING',
        createdBy: 'AI_SUGGESTED',
        assessorApproved: false
      }
    });

    return {
      success: true,
      traceId: trace.id,
      criterionCode: criterion.code,
      evidenceId: dto.evidenceId,
      assessorApproved: false,
      notice: 'Evidence link requires human assessor review.'
    };
  }

  async suggestScore(dto: SuggestScoreDto) {
    const criterion = await prisma.criterion.findUnique({
      where: { id: dto.criterionId }
    });
    if (!criterion) {
      throw new BadRequestException(`Criterion ${dto.criterionId} not found.`);
    }

    const suggestion = await this.provider.suggestScore({
      criterionId: dto.criterionId,
      observation: dto.observation,
      maxPractical: dto.maxPracticalMarks || criterion.practicalMarks,
      maxTheory: dto.maxTheoryMarks || criterion.theoryMarks,
      maxViva: dto.maxVivaMarks || criterion.vivaMarks
    });

    return {
      success: true,
      criterionId: dto.criterionId,
      criterionCode: criterion.code,
      suggestedAssessment: suggestion.suggestedAssessment,
      suggestedPracticalMarks: suggestion.suggestedPracticalMarks,
      suggestedTheoryMarks: suggestion.suggestedTheoryMarks,
      suggestedVivaMarks: suggestion.suggestedVivaMarks,
      confidence: suggestion.confidence,
      rationale: suggestion.rationale,
      disclaimer: 'NON-AUTHORITATIVE: Suggested mark on exact official scale. Final marks must be decided by human assessor.'
    };
  }
}
