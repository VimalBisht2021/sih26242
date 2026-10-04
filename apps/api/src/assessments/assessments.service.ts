import {
  Injectable,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { prisma } from '@sih26242/database';
import {
  WorkflowState,
  RecommendationOutcome,
  AssessorDecision,
  FinalDisposition,
  RPLPathway,
  ThresholdOperator,
  CriterionStatus,
  AssessmentComponentType
} from '@sih26242/contracts';
import {
  evaluateRecommendation,
  determineRPLPathway,
  calculateOfficialScore,
  calculateMappedExperientialCoverage,
  calculateAssessedCoverage,
  calculateDemonstratedCoverage,
  validateStateTransition
} from '@sih26242/domain';
import { QualificationRepository } from '@sih26242/qualification';
import { computeSha256 } from '@sih26242/shared';

export interface CreateAssessmentDto {
  candidateId: string;
  qualificationCode: string;
  assessorId: string;
  siteId: string;
  aiProposedMappedCoverage?: number;
  assessorConfirmedMappedCoverage?: number;
  thresholdOperator?: string;
}

export interface PathwayOverrideDto {
  assessorId: string;
  reasonCode: string;
  rationale: string;
}

export interface RecommendationDecisionDto {
  assessorId: string;
  decision: AssessorDecision;
  requestedFinalDisposition?: FinalDisposition;
  reasonCode?: string;
  rationale?: string;
}

export interface FinalizeAssessmentDto {
  assessorId: string;
  action: 'SIGN_OFF' | 'FINALIZE_REFERRAL';
  assessorDecision?: AssessorDecision;
  requestedFinalDisposition?: FinalDisposition;
  reasonCode?: string;
  rationale?: string;
  isOfflineSubmission?: boolean;
  proctoringAttested?: boolean;
}

@Injectable()
export class AssessmentsService {
  async createAssessment(dto: CreateAssessmentDto) {
    const candidate = await prisma.candidate.findUnique({
      where: { id: dto.candidateId }
    });
    if (!candidate) {
      throw new NotFoundException(`Candidate ${dto.candidateId} not found.`);
    }

    const q = await prisma.qualificationVersion.findFirst({
      where: { externalCode: dto.qualificationCode },
      include: { criteria: true }
    });
    if (!q) {
      throw new NotFoundException(`Qualification ${dto.qualificationCode} not found in database.`);
    }

    const site = await prisma.site.findUnique({
      where: { siteId: dto.siteId }
    });
    if (!site) {
      throw new NotFoundException(`Site ${dto.siteId} not found.`);
    }

    // Determine RPL Pathway
    const pathway = determineRPLPathway(
      q.nsqfLevel,
      candidate.highestFormalEducation as any,
      candidate.currentEnrolment as any
    );


    // Initial Workflow State
    let initialWorkflowState: WorkflowState = WorkflowState.MAPPING_PENDING;
    let initialOutcome: RecommendationOutcome = RecommendationOutcome.PATHWAY_CONFIRMATION_REQUIRED;

    if (pathway === RPLPathway.RPL_A) {
      if (dto.assessorConfirmedMappedCoverage !== undefined && dto.assessorConfirmedMappedCoverage !== null) {
        initialWorkflowState = WorkflowState.PATHWAY_SELECTED;
        initialOutcome =
          dto.assessorConfirmedMappedCoverage >= 70
            ? RecommendationOutcome.ASSESSMENT_REQUIRED
            : RecommendationOutcome.UPSKILLING_REQUIRED;
      } else {
        initialWorkflowState = WorkflowState.PATHWAY_CONFIRMATION_PENDING;
        initialOutcome = RecommendationOutcome.PATHWAY_CONFIRMATION_REQUIRED;
      }
    } else {
      // RPL-B, RPL-C, RPL-D skip the 70% mapping gate
      initialWorkflowState = WorkflowState.PATHWAY_SELECTED;
      initialOutcome = RecommendationOutcome.ASSESSMENT_REQUIRED;
    }

    const assessment = await prisma.assessment.create({
      data: {
        candidateId: candidate.id,
        qualificationVersionId: q.id,
        assessorId: dto.assessorId,
        siteId: site.siteId,
        workflowState: initialWorkflowState,
        rplPathway: pathway,
        systemOutcome: initialOutcome,
        aiProposedMappedCoverage: dto.aiProposedMappedCoverage ?? null,
        assessorConfirmedMappedCoverage: dto.assessorConfirmedMappedCoverage ?? null,
        coverageThresholdValue: 70,
        coverageThresholdOperator: dto.thresholdOperator || '>=',
        policyVersion: '2024.1',
        schemeVersion: q.version
      }
    });

    // Initialize CriterionAssessments for all qualification criteria
    for (const crit of q.criteria) {
      await prisma.criterionAssessment.create({
        data: {
          assessmentId: assessment.id,
          criterionId: crit.id,
          assessorId: dto.assessorId,
          status: CriterionStatus.NOT_DEMONSTRATED,
          theoryMarks: 0,
          practicalMarks: 0,
          vivaMarks: 0,
          totalAwardedMarks: 0,
          evidenceOpened: false
        }
      });
    }

    // Create Audit Event
    await prisma.auditEvent.create({
      data: {
        assessmentId: assessment.id,
        actorId: dto.assessorId,
        actorRole: 'ASSESSOR',
        eventType: 'ASSESSMENT_CREATED',
        entityType: 'Assessment',
        entityId: assessment.id,
        payloadJson: JSON.stringify({
          candidateId: candidate.id,
          qualificationCode: q.externalCode,
          pathway,
          initialWorkflowState
        })
      }
    });

    return this.getAssessment(assessment.id);
  }

  async getAssessment(id: string) {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        candidate: {
          include: { experienceStatements: true }
        },
        qualificationVersion: {
          include: {
            nos: {
              include: { criteria: true }
            }
          }
        },
        site: true,
        sessions: {
          include: { evidenceItems: true }
        },
        criterionAssessments: {
          include: {
            criterion: true
          }
        },
        scoreSnapshots: {
          orderBy: { calculatedAt: 'desc' },
          take: 1
        },
        recommendationSnapshots: {
          orderBy: { generatedAt: 'desc' },
          take: 1
        },
        auditEvents: {
          orderBy: { serverTimestamp: 'desc' }
        }
      }
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${id} not found.`);
    }

    const pkg = QualificationRepository.getPackage(assessment.qualificationVersion.externalCode);
    const tasks = pkg ? pkg.tasks : [];

    return {
      ...assessment,
      tasks
    };
  }

  async listAssessments() {
    const list = await prisma.assessment.findMany({
      include: {
        candidate: true,
        qualificationVersion: true,
        sessions: {
          take: 1,
          orderBy: { startedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return list.map(a => ({
      id: a.id,
      candidateId: a.candidateId,
      candidateName: a.candidate?.fullName || 'Unknown Candidate',
      candidatePhone: a.candidate?.phone || null,
      qualificationCode: a.qualificationVersion?.externalCode || 'AMH/Q0301',
      qualificationTitle: a.qualificationVersion?.title || 'Sewing Machine Operator',
      nsqfLevel: a.qualificationVersion?.nsqfLevel ?? 3,
      workflowState: a.workflowState,
      rplPathway: a.rplPathway,
      isLocked: a.isLocked,
      finalDisposition: a.finalDisposition,
      sessionCode: a.sessions?.[0]?.sessionCode || null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt
    }));
  }

  async startAssessment(id: string, assessorId: string, deviceId: string = 'web-client-01') {
    const assessment = await this.getAssessment(id);

    if (assessment.isLocked) {
      throw new BadRequestException('Assessment is LOCKED. No modifications allowed.');
    }

    // Validate state transition
    const transition = validateStateTransition(
      assessment.workflowState as WorkflowState,
      WorkflowState.ASSESSMENT_READY
    );
    if (!transition.valid) {
      // If already in ASSESSMENT_READY or in progress, allow starting/resuming session
      if (assessment.workflowState !== WorkflowState.ASSESSMENT_READY && assessment.workflowState !== WorkflowState.ASSESSMENT_IN_PROGRESS) {
        throw new BadRequestException(transition.reason);
      }
    }

    // Create new Assessment Session
    const sessionCode = `SES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const session = await prisma.assessmentSession.create({
      data: {
        sessionCode,
        assessmentId: id,
        assessorId,
        deviceId,
        startedAt: new Date()
      }
    });

    // Update assessment workflow state to ASSESSMENT_IN_PROGRESS
    await prisma.assessment.update({
      where: { id },
      data: {
        workflowState: WorkflowState.ASSESSMENT_IN_PROGRESS,
        systemOutcome: RecommendationOutcome.ASSESSMENT_REQUIRED
      }
    });

    await prisma.auditEvent.create({
      data: {
        assessmentId: id,
        actorId: assessorId,
        actorRole: 'ASSESSOR',
        eventType: 'SESSION_STARTED',
        entityType: 'AssessmentSession',
        entityId: session.id,
        payloadJson: JSON.stringify({ sessionCode, deviceId })
      }
    });

    return {
      success: true,
      session,
      workflowState: WorkflowState.ASSESSMENT_IN_PROGRESS
    };
  }

  async getProfile(id: string) {
    const assessment = await this.getAssessment(id);
    const criteria = assessment.criterionAssessments;
    const qp = assessment.qualificationVersion;

    const allCriteria = criteria.map(c => ({
      criterionId: c.criterionId,
      mandatory: c.criterion.mandatory,
      status: c.status as CriterionStatus,
      theoryMarks: c.theoryMarks,
      practicalMarks: c.practicalMarks,
      vivaMarks: c.vivaMarks,
      maxTheoryMarks: c.criterion.theoryMarks,
      maxPracticalMarks: c.criterion.practicalMarks,
      maxVivaMarks: c.criterion.vivaMarks
    }));

    const scheme = {
      aggregatePassPercentage: qp.passPercentage,
      components: [
        { type: AssessmentComponentType.THEORY, maxMarks: qp.totalTheoryMarks },
        { type: AssessmentComponentType.PRACTICAL, maxMarks: qp.totalPracticalMarks },
        { type: AssessmentComponentType.VIVA, maxMarks: qp.totalVivaMarks }
      ]
    };

    const scoreResult = calculateOfficialScore(allCriteria, scheme);

    // Compute three distinct coverages
    const allCriteriaIds = criteria.map(c => c.criterionId);
    const assessedIds = criteria.filter(c => c.status !== CriterionStatus.NOT_DEMONSTRATED || c.totalAwardedMarks > 0).map(c => c.criterionId);
    const demonstratedIds = criteria.filter(c => c.status === CriterionStatus.DEMONSTRATED || c.status === CriterionStatus.MEETS_ANCHOR).map(c => c.criterionId);

    const assessedCoverage = calculateAssessedCoverage(assessedIds, allCriteriaIds);
    const demonstratedCoverage = calculateDemonstratedCoverage(demonstratedIds, allCriteriaIds);
    const mappedCoverage = assessment.assessorConfirmedMappedCoverage || assessment.aiProposedMappedCoverage || 0;

    // NOS breakdown
    const nosBreakdown = qp.nos.map(n => {
      const nCriteria = criteria.filter(c => c.criterion.nosId === n.id);
      const demonstratedCount = nCriteria.filter(c => c.status === CriterionStatus.DEMONSTRATED || c.status === CriterionStatus.MEETS_ANCHOR).length;
      const partialCount = nCriteria.filter(c => c.status === CriterionStatus.PARTIAL).length;
      const notDemonstratedCount = nCriteria.filter(c => c.status === CriterionStatus.NOT_DEMONSTRATED).length;

      let status: 'DEMONSTRATED' | 'PARTIAL' | 'NOT_DEMONSTRATED' = 'NOT_DEMONSTRATED';
      if (demonstratedCount === nCriteria.length && nCriteria.length > 0) status = 'DEMONSTRATED';
      else if (demonstratedCount > 0 || partialCount > 0) status = 'PARTIAL';

      return {
        nosCode: n.code,
        nosTitle: n.title,
        criteriaCount: nCriteria.length,
        demonstratedCount,
        partialCount,
        notDemonstratedCount,
        status
      };
    });

    return {
      qualificationCode: qp.externalCode,
      qualificationTitle: qp.title,
      qualificationVersion: qp.version,
      nsqfLevel: qp.nsqfLevel,
      rplPathway: assessment.rplPathway,
      mappedExperientialCoverage: mappedCoverage,
      assessedCoverage,
      demonstratedCoverage,
      mandatoryCriteriaCount: scoreResult.mandatoryCriteriaCount,
      mandatoryCriteriaSatisfied: scoreResult.mandatoryCriteriaSatisfied,
      mandatoryCriteriaPass: scoreResult.mandatoryCriteriaPass,
      nosBreakdown,
      score: {
        theoryScore: scoreResult.theoryScore,
        practicalScore: scoreResult.practicalScore,
        vivaScore: scoreResult.vivaScore,
        totalScore: scoreResult.totalScore,
        maxScore: scoreResult.maxScore,
        scorePercentage: scoreResult.scorePercentage,
        qualifyingRulePassed: scoreResult.qualifyingRulePassed,
        componentTotals: scoreResult.componentTotals
      },
      workflowState: assessment.workflowState,
      systemOutcome: assessment.systemOutcome
    };
  }

  async getRecommendation(id: string) {
    const profile = await this.getProfile(id);
    const assessment = await this.getAssessment(id);

    const recResult = evaluateRecommendation({
      workflowState: assessment.workflowState as WorkflowState,
      nsqfLevel: profile.nsqfLevel,
      highestFormalEducation: assessment.candidate.highestFormalEducation as any,
      currentEnrolment: assessment.candidate.currentEnrolment as any,
      assessorConfirmedMappedExperientialCoverage: assessment.assessorConfirmedMappedCoverage,
      coverageThresholdValue: assessment.coverageThresholdValue,
      coverageThresholdOperator: assessment.coverageThresholdOperator as ThresholdOperator,
      assessmentComponentsComplete: true,
      requiredEvidenceMissing: false,
      hasUnresolvedMandatoryCriteria: profile.mandatoryCriteriaCount > profile.mandatoryCriteriaSatisfied,
      mandatoryCriteriaPass: profile.mandatoryCriteriaPass,
      qualificationMinimumRulePass: profile.score.qualifyingRulePassed,
      assessorDecision: assessment.assessorDecision as any,
      overrideRationale: assessment.overrideRationale
    });


    return {
      assessmentId: id,
      workflowState: assessment.workflowState,
      systemOutcome: recResult.systemOutcome,
      evaluatedState: recResult.workflowState,
      pathway: recResult.pathway,
      thresholdPassed: recResult.thresholdPassed,
      assessorDecision: assessment.assessorDecision,
      finalDisposition: assessment.finalDisposition,
      mandatoryCriteriaPass: profile.mandatoryCriteriaPass,
      qualifyingRulePassed: profile.score.qualifyingRulePassed,
      overrideRejected: recResult.overrideRejected,
      rejectionReason: recResult.rejectionReason
    };
  }

  async applyPathwayOverride(id: string, dto: PathwayOverrideDto) {
    const assessment = await this.getAssessment(id);

    if (assessment.isLocked) {
      throw new BadRequestException('Assessment is LOCKED.');
    }

    if (!dto.rationale || dto.rationale.trim().length === 0) {
      throw new BadRequestException('PATHWAY_ROUTING_OVERRIDE requires a documented rationale.');
    }

    const rec = evaluateRecommendation({
      nsqfLevel: assessment.qualificationVersion.nsqfLevel,
      highestFormalEducation: assessment.candidate.highestFormalEducation as any,
      currentEnrolment: assessment.candidate.currentEnrolment as any,
      assessorConfirmedMappedExperientialCoverage: assessment.assessorConfirmedMappedCoverage,
      coverageThresholdValue: assessment.coverageThresholdValue,
      coverageThresholdOperator: assessment.coverageThresholdOperator as ThresholdOperator,
      assessorDecision: AssessorDecision.PATHWAY_ROUTING_OVERRIDE,
      overrideRationale: dto.rationale
    });


    if (rec.overrideRejected) {
      throw new BadRequestException(rec.rejectionReason || 'Override rejected by policy.');
    }

    await prisma.assessment.update({
      where: { id },
      data: {
        workflowState: WorkflowState.ASSESSMENT_READY,
        assessorDecision: AssessorDecision.PATHWAY_ROUTING_OVERRIDE,
        overrideRationale: dto.rationale,
        reasonCode: dto.reasonCode
      }
    });

    await prisma.auditEvent.create({
      data: {
        assessmentId: id,
        actorId: dto.assessorId,
        actorRole: 'ASSESSOR',
        eventType: 'PATHWAY_ROUTING_OVERRIDE_APPLIED',
        entityType: 'Assessment',
        entityId: id,
        payloadJson: JSON.stringify(dto)
      }
    });

    return {
      success: true,
      workflowState: WorkflowState.ASSESSMENT_READY,
      assessorDecision: AssessorDecision.PATHWAY_ROUTING_OVERRIDE
    };
  }

  async applyRecommendationDecision(id: string, dto: RecommendationDecisionDto) {
    const assessment = await this.getAssessment(id);

    if (assessment.isLocked) {
      throw new BadRequestException('Assessment is LOCKED.');
    }

    const profile = await this.getProfile(id);

    const rec = evaluateRecommendation({
      nsqfLevel: profile.nsqfLevel,
      highestFormalEducation: assessment.candidate.highestFormalEducation as any,
      currentEnrolment: assessment.candidate.currentEnrolment as any,
      assessorConfirmedMappedExperientialCoverage: assessment.assessorConfirmedMappedCoverage,
      assessmentComponentsComplete: true,
      requiredEvidenceMissing: false,
      hasUnresolvedMandatoryCriteria: profile.mandatoryCriteriaCount > profile.mandatoryCriteriaSatisfied,
      mandatoryCriteriaPass: profile.mandatoryCriteriaPass,
      qualificationMinimumRulePass: profile.score.qualifyingRulePassed,
      assessorDecision: dto.decision as any,
      overrideRationale: dto.rationale,
      requestedFinalDisposition: dto.requestedFinalDisposition
    });


    if (rec.overrideRejected) {
      throw new BadRequestException(rec.rejectionReason || 'Assessor decision rejected.');
    }

    await prisma.assessment.update({
      where: { id },
      data: {
        assessorDecision: dto.decision,
        finalDisposition: rec.finalDisposition,
        overrideRationale: dto.rationale,
        reasonCode: dto.reasonCode
      }
    });

    await prisma.auditEvent.create({
      data: {
        assessmentId: id,
        actorId: dto.assessorId,
        actorRole: 'ASSESSOR',
        eventType: 'ASSESSOR_DECISION_RECORDED',
        entityType: 'Assessment',
        entityId: id,
        payloadJson: JSON.stringify(dto)
      }
    });

    return {
      success: true,
      assessorDecision: dto.decision,
      finalDisposition: rec.finalDisposition,
      workflowState: assessment.workflowState
    };
  }

  async finalizeAssessment(id: string, dto: FinalizeAssessmentDto) {
    if (dto.isOfflineSubmission) {
      throw new BadRequestException(
        'Offline finalization is prohibited. You must synchronize with the server before authoritative sign-off or referral finalization.'
      );
    }

    const assessment = await this.getAssessment(id);

    if (assessment.isLocked) {
      throw new BadRequestException('Assessment is already LOCKED. No changes permitted.');
    }

    if (assessment.assessorId !== dto.assessorId) {
      throw new BadRequestException(`Assessor ${dto.assessorId} is not assigned to assessment ${id}.`);
    }

    // Orientation requirement check for RPL-A
    if (assessment.rplPathway === RPLPathway.RPL_A && assessment.orientationCompletedHours < 12) {
      throw new BadRequestException(
        `Orientation requirement not met. Candidate completed ${assessment.orientationCompletedHours} hours, 12 hours required.`
      );
    }

    const profile = await this.getProfile(id);
    const sessions = assessment.sessions;
    const allEvidence = sessions.flatMap(s => s.evidenceItems);

    // Verify evidence requirements for practical tasks
    const tasks = assessment.tasks || [];
    const missingEvidenceTasks = tasks.filter(t => !allEvidence.some(e => e.taskCode === t.taskCode));

    const recResult = evaluateRecommendation({
      workflowState: assessment.workflowState as WorkflowState,
      nsqfLevel: profile.nsqfLevel,
      highestFormalEducation: assessment.candidate.highestFormalEducation as any,
      currentEnrolment: assessment.candidate.currentEnrolment as any,
      assessorConfirmedMappedExperientialCoverage: assessment.assessorConfirmedMappedCoverage,
      coverageThresholdValue: assessment.coverageThresholdValue,
      coverageThresholdOperator: assessment.coverageThresholdOperator as ThresholdOperator,
      assessmentComponentsComplete: true,
      requiredEvidenceMissing: missingEvidenceTasks.length > 0,
      hasUnresolvedMandatoryCriteria: profile.mandatoryCriteriaCount > profile.mandatoryCriteriaSatisfied,
      mandatoryCriteriaPass: profile.mandatoryCriteriaPass,
      qualificationMinimumRulePass: profile.score.qualifyingRulePassed,
      assessorDecision: (dto.assessorDecision || (dto.action === 'SIGN_OFF' ? AssessorDecision.ACCEPT_RECOMMENDATION : AssessorDecision.ACCEPT_RECOMMENDATION)) as any,
      overrideRationale: dto.rationale,
      requestedFinalDisposition: dto.requestedFinalDisposition
    });


    if (dto.action === 'SIGN_OFF') {
      if (!profile.score.qualifyingRulePassed) {
        throw new BadRequestException(
          `Cannot SIGN_OFF: Aggregate score (${profile.score.scorePercentage.toFixed(1)}%) is below required minimum pass (${assessment.qualificationVersion.passPercentage}%).`
        );
      }
      if (!profile.mandatoryCriteriaPass) {
        throw new BadRequestException('Cannot SIGN_OFF: Mandatory criteria failed or unresolved.');
      }
      if (missingEvidenceTasks.length > 0) {
        throw new BadRequestException(
          `Cannot SIGN_OFF: Missing required evidence for tasks: ${missingEvidenceTasks.map(t => t.taskCode).join(', ')}.`
        );
      }
      if (recResult.overrideRejected) {
        throw new BadRequestException(recResult.rejectionReason || 'Sign-off prohibited by policy.');
      }
    }

    // Determine final workflow state and disposition
    let targetWorkflowState: WorkflowState;
    let targetDisposition: FinalDisposition;

    if (dto.action === 'SIGN_OFF') {
      targetWorkflowState = WorkflowState.SIGNED_OFF;
      targetDisposition = FinalDisposition.SUITABLE_FOR_SIGNOFF;
    } else {
      targetWorkflowState = WorkflowState.REPORT_FINALIZED_NOT_RECOMMENDED;
      targetDisposition = dto.requestedFinalDisposition || recResult.finalDisposition || FinalDisposition.UPSKILLING_REFERRAL;
    }

    // Execute server-side finalization transaction
    const finalized = await prisma.$transaction(async (tx) => {
      // 1. Create Score Snapshot
      const scoreSnapshot = await tx.scoreSnapshot.create({
        data: {
          assessmentId: id,
          theoryScore: profile.score.theoryScore,
          practicalScore: profile.score.practicalScore,
          vivaScore: profile.score.vivaScore,
          totalScore: profile.score.totalScore,
          maxScore: profile.score.maxScore,
          scorePercentage: profile.score.scorePercentage,
          componentTotalsJson: JSON.stringify(profile.score.componentTotals),
          qualifyingRulePassed: profile.score.qualifyingRulePassed,
          isAuthoritative: true
        }
      });

      // 2. Create Recommendation Snapshot
      const recommendationSnapshot = await tx.recommendationSnapshot.create({
        data: {
          assessmentId: id,
          workflowState: targetWorkflowState,
          systemOutcome: recResult.systemOutcome,
          pathway: recResult.pathway,
          mappedCoverage: profile.mappedExperientialCoverage,
          assessedCoverage: profile.assessedCoverage,
          demonstratedCoverage: profile.demonstratedCoverage,
          mandatoryCriteriaPass: profile.mandatoryCriteriaPass,
          minimumPassRulePass: profile.score.qualifyingRulePassed,
          evidenceComplete: missingEvidenceTasks.length === 0,
          unresolvedCriteriaCount: profile.mandatoryCriteriaCount - profile.mandatoryCriteriaSatisfied,
          policyVersion: assessment.policyVersion
        }
      });

      // 3. Update Assessment: record final state and lock record
      const updatedAssessment = await tx.assessment.update({
        where: { id },
        data: {
          workflowState: targetWorkflowState,
          systemOutcome: recResult.systemOutcome,
          assessorDecision: dto.assessorDecision || AssessorDecision.ACCEPT_RECOMMENDATION,
          finalDisposition: targetDisposition,
          reasonCode: dto.reasonCode,
          overrideRationale: dto.rationale,
          assessedCoverage: profile.assessedCoverage,
          demonstratedCoverage: profile.demonstratedCoverage,
          isLocked: true,
          lockedAt: new Date()
        }
      });

      // 4. Append immutable Audit Event
      await tx.auditEvent.create({
        data: {
          assessmentId: id,
          actorId: dto.assessorId,
          actorRole: 'ASSESSOR',
          eventType: dto.action === 'SIGN_OFF' ? 'ASSESSMENT_SIGNED_OFF' : 'REPORT_FINALIZED_NOT_RECOMMENDED',
          entityType: 'Assessment',
          entityId: id,
          payloadJson: JSON.stringify({
            action: dto.action,
            finalDisposition: targetDisposition,
            totalScore: profile.score.totalScore,
            maxScore: profile.score.maxScore,
            scorePercentage: profile.score.scorePercentage,
            qualifyingRulePassed: profile.score.qualifyingRulePassed,
            mandatoryCriteriaPass: profile.mandatoryCriteriaPass,
            scoreSnapshotId: scoreSnapshot.id,
            recommendationSnapshotId: recommendationSnapshot.id,
            serverTimestamp: new Date().toISOString()
          })
        }
      });

      return updatedAssessment;
    });

    return {
      success: true,
      assessmentId: id,
      action: dto.action,
      workflowState: targetWorkflowState,
      finalDisposition: targetDisposition,
      isLocked: true,
      lockedAt: finalized.lockedAt,
      profile,
      finalScore: profile.score,
      certificationRecommendationPackage: dto.action === 'SIGN_OFF' ? {
        qualificationCode: assessment.qualificationVersion.externalCode,
        qualificationTitle: assessment.qualificationVersion.title,
        qualificationVersion: assessment.qualificationVersion.version,
        nsqfLevel: assessment.qualificationVersion.nsqfLevel,
        candidateName: assessment.candidate.fullName,
        rplPathway: assessment.rplPathway,
        demonstratedCoverage: profile.demonstratedCoverage,
        totalScore: profile.score.totalScore,
        maxScore: profile.score.maxScore,
        scorePercentage: profile.score.scorePercentage,
        assessorId: dto.assessorId,
        signedOffAt: finalized.lockedAt
      } : null,
      negativeReport: dto.action === 'FINALIZE_REFERRAL' ? {
        qualificationCode: assessment.qualificationVersion.externalCode,
        qualificationTitle: assessment.qualificationVersion.title,
        candidateName: assessment.candidate.fullName,
        finalDisposition: targetDisposition,
        remediationGaps: profile.nosBreakdown.filter(n => n.status !== 'DEMONSTRATED'),
        mandatoryCriteriaPass: profile.mandatoryCriteriaPass,
        scorePercentage: profile.score.scorePercentage,
        assessorDecision: dto.assessorDecision,
        rationale: dto.rationale
      } : null
    };
  }

  async getEvidenceIntegrity(id: string) {
    const assessment = await this.getAssessment(id);
    const sessions = assessment.sessions;
    const allEvidence = sessions.flatMap(s => s.evidenceItems);

    return {
      assessmentId: id,
      totalEvidenceCount: allEvidence.length,
      evidenceItems: allEvidence.map(e => ({
        evidenceId: e.id,
        taskCode: e.taskCode,
        sha256: e.sha256,
        evidenceType: e.evidenceType,
        locationStatus: e.locationStatus,
        latitude: e.latitude,
        longitude: e.longitude,
        mockLocationFlag: e.mockLocationFlag,
        geolocationIntegrityFlag: e.geolocationIntegrityFlag,
        proctoringStatus: e.proctoringStatus,
        proctoringAttestedBy: e.proctoringAttestedBy,
        proctoringAttestedAt: e.proctoringAttestedAt,
        capturedAtClient: e.capturedAtClient,
        capturedAtServer: e.capturedAtServer,
        clockSkewSeconds: e.clockSkewSeconds
      }))
    };
  }
}


