import {
  WorkflowState,
  RecommendationOutcome,
  AssessorDecision,
  FinalDisposition,
  RPLPathway,
  ThresholdOperator,
  EducationLevel,
  EnrolmentStatus
} from '@sih26242/contracts';

export interface RecommendationEngineInput {
  workflowState?: WorkflowState;
  nsqfLevel: number;
  highestFormalEducation?: EducationLevel | null;
  currentEnrolment?: EnrolmentStatus | null;
  educationContextVerified?: boolean;
  
  // Pathway threshold inputs
  aiProposedMappedExperientialCoverage?: number | null;
  assessorConfirmedMappedExperientialCoverage?: number | null;
  coverageThresholdValue?: number; // default 70
  coverageThresholdOperator?: ThresholdOperator; // default '>='
  
  // Assessment execution state
  assessmentComponentsComplete?: boolean;
  requiredEvidenceMissing?: boolean;
  hasUnresolvedMandatoryCriteria?: boolean;
  mandatoryCriteriaPass?: boolean;
  qualificationMinimumRulePass?: boolean;
  
  // Assessor decision
  assessorDecision?: AssessorDecision | null;
  overrideRationale?: string | null;
  requestedFinalDisposition?: FinalDisposition | null;
  moderationAllowedByPolicy?: boolean;
}

export interface RecommendationEngineResult {
  workflowState: WorkflowState;
  systemOutcome: RecommendationOutcome;
  pathway: RPLPathway;
  thresholdPassed: boolean | null;
  assessorDecisionApplied: AssessorDecision | null;
  finalDisposition: FinalDisposition | null;
  overrideRejected: boolean;
  rejectionReason?: string;
  isSecondReviewRequested?: boolean;
}

/**
 * Determine RPL Pathway from NSQF level and education/enrolment context.
 */
export function determineRPLPathway(
  nsqfLevel: number,
  highestEducation?: EducationLevel | null,
  currentEnrolment?: EnrolmentStatus | null
): RPLPathway {
  if (nsqfLevel <= 3.5) {
    return RPLPathway.RPL_A;
  }
  if (nsqfLevel >= 4 && nsqfLevel <= 6) {
    const hasFormalHigherSec =
      highestEducation === EducationLevel.TWELFTH ||
      highestEducation === EducationLevel.DIPLOMA ||
      highestEducation === EducationLevel.UG ||
      highestEducation === EducationLevel.PG ||
      currentEnrolment === EnrolmentStatus.UG_PURSUING ||
      currentEnrolment === EnrolmentStatus.PG_PURSUING;
    return hasFormalHigherSec ? RPLPathway.RPL_B : RPLPathway.RPL_C;
  }
  return RPLPathway.RPL_D;
}

/**
 * Check if experiential coverage meets threshold with the configured operator.
 */
export function evaluatesThreshold(
  coverage: number,
  thresholdValue: number = 70,
  operator: ThresholdOperator = ThresholdOperator.GREATER_THAN_OR_EQUAL
): boolean {
  if (operator === ThresholdOperator.GREATER_THAN_OR_EQUAL) {
    return coverage >= thresholdValue;
  }
  return coverage > thresholdValue;
}

/**
 * Pure, deterministic Recommendation Engine (Section 10, Rules 1-11).
 */
export function evaluateRecommendation(input: RecommendationEngineInput): RecommendationEngineResult {
  const thresholdVal = input.coverageThresholdValue ?? 70;
  const thresholdOp = input.coverageThresholdOperator ?? ThresholdOperator.GREATER_THAN_OR_EQUAL;

  // Rule 1: Determine pathway and check required context
  const pathway = determineRPLPathway(
    input.nsqfLevel,
    input.highestFormalEducation,
    input.currentEnrolment
  );

  // Missing required context blocks pathway routing
  if (
    input.highestFormalEducation === undefined ||
    input.highestFormalEducation === null ||
    input.currentEnrolment === undefined ||
    input.currentEnrolment === null
  ) {
    return {
      workflowState: WorkflowState.PATHWAY_CONFIRMATION_PENDING,
      systemOutcome: RecommendationOutcome.PATHWAY_CONFIRMATION_REQUIRED,
      pathway,
      thresholdPassed: null,
      assessorDecisionApplied: null,
      finalDisposition: null,
      overrideRejected: false
    };
  }

  // Rule 2: If pathway is RPL-A (threshold applies) and assessor-confirmed coverage is null -> PATHWAY_CONFIRMATION_REQUIRED
  if (pathway === RPLPathway.RPL_A) {
    if (
      input.assessorConfirmedMappedExperientialCoverage === undefined ||
      input.assessorConfirmedMappedExperientialCoverage === null
    ) {
      return {
        workflowState: WorkflowState.PATHWAY_CONFIRMATION_PENDING,
        systemOutcome: RecommendationOutcome.PATHWAY_CONFIRMATION_REQUIRED,
        pathway,
        thresholdPassed: null,
        assessorDecisionApplied: null,
        finalDisposition: null,
        overrideRejected: false
      };
    }
  }

  // Rule 3: If threshold applies and assessor-confirmed coverage is below threshold -> UPSKILLING_REQUIRED
  let thresholdPassed: boolean | null = null;
  if (pathway === RPLPathway.RPL_A) {
    const confirmedCoverage = input.assessorConfirmedMappedExperientialCoverage!;
    thresholdPassed = evaluatesThreshold(confirmedCoverage, thresholdVal, thresholdOp);

    if (!thresholdPassed) {
      // If assessor invokes PATHWAY_ROUTING_OVERRIDE with rationale, route to direct assessment
      if (input.assessorDecision === AssessorDecision.PATHWAY_ROUTING_OVERRIDE) {
        if (!input.overrideRationale || input.overrideRationale.trim().length === 0) {
          return {
            workflowState: WorkflowState.PATHWAY_SELECTED,
            systemOutcome: RecommendationOutcome.UPSKILLING_REQUIRED,
            pathway,
            thresholdPassed: false,
            assessorDecisionApplied: null,
            finalDisposition: null,
            overrideRejected: true,
            rejectionReason: 'PATHWAY_ROUTING_OVERRIDE requires structured rationale'
          };
        }
        return {
          workflowState: WorkflowState.ASSESSMENT_READY,
          systemOutcome: RecommendationOutcome.UPSKILLING_REQUIRED,
          pathway,
          thresholdPassed: false,
          assessorDecisionApplied: AssessorDecision.PATHWAY_ROUTING_OVERRIDE,
          finalDisposition: null,
          overrideRejected: false
        };
      }

      // If assessor accepts upskilling recommendation
      if (input.assessorDecision === AssessorDecision.ACCEPT_RECOMMENDATION) {
        return {
          workflowState: WorkflowState.FINAL_REPORT_READY,
          systemOutcome: RecommendationOutcome.UPSKILLING_REQUIRED,
          pathway,
          thresholdPassed: false,
          assessorDecisionApplied: AssessorDecision.ACCEPT_RECOMMENDATION,
          finalDisposition: FinalDisposition.UPSKILLING_REFERRAL,
          overrideRejected: false
        };
      }

      return {
        workflowState: WorkflowState.PATHWAY_SELECTED,
        systemOutcome: RecommendationOutcome.UPSKILLING_REQUIRED,
        pathway,
        thresholdPassed: false,
        assessorDecisionApplied: null,
        finalDisposition: null,
        overrideRejected: false
      };
    }
  }

  // At this point, candidate is eligible for assessment (threshold passed or non-threshold pathway)
  // If assessment has not started yet
  if (input.assessmentComponentsComplete === undefined && input.requiredEvidenceMissing === undefined) {
    return {
      workflowState: WorkflowState.ASSESSMENT_READY,
      systemOutcome: RecommendationOutcome.ASSESSMENT_REQUIRED,
      pathway,
      thresholdPassed,
      assessorDecisionApplied: null,
      finalDisposition: null,
      overrideRejected: false
    };
  }

  // Rule 4: If required assessment components are not all complete
  if (input.assessmentComponentsComplete === false) {
    return {
      workflowState: WorkflowState.ASSESSMENT_IN_PROGRESS,
      systemOutcome: RecommendationOutcome.ASSESSMENT_REQUIRED,
      pathway,
      thresholdPassed,
      assessorDecisionApplied: null,
      finalDisposition: null,
      overrideRejected: false
    };
  }

  // TIE BREAK PRECEDENCE:
  // missing required evidence > unresolved mandatory criterion > mandatory failure > minimum-pass failure > suitable-for-signoff

  // Rule 5: If components are complete but required evidence is missing -> ASSESSMENT_INCOMPLETE
  if (input.requiredEvidenceMissing === true) {
    return {
      workflowState: WorkflowState.ASSESSMENT_IN_PROGRESS,
      systemOutcome: RecommendationOutcome.ASSESSMENT_INCOMPLETE,
      pathway,
      thresholdPassed,
      assessorDecisionApplied: null,
      finalDisposition: null,
      overrideRejected: false
    };
  }

  // Rule 6: If any mandatory criterion is unresolved -> ASSESSMENT_REVIEW_REQUIRED / CRITERION_RESOLUTION_REQUIRED
  if (input.hasUnresolvedMandatoryCriteria === true) {
    return {
      workflowState: WorkflowState.CRITERION_RESOLUTION_REQUIRED,
      systemOutcome: RecommendationOutcome.ASSESSMENT_REVIEW_REQUIRED,
      pathway,
      thresholdPassed,
      assessorDecisionApplied: null,
      finalDisposition: null,
      overrideRejected: false
    };
  }

  // Rule 7 & 8: Mandatory failure OR qualification minimum-pass failure -> NOT_SUITABLE_FOR_SIGNOFF
  const hasMandatoryFailure = input.mandatoryCriteriaPass === false;
  const hasMinPassFailure = input.qualificationMinimumRulePass === false;

  if (hasMandatoryFailure || hasMinPassFailure) {
    const isUpwardOverrideAttempt =
      input.assessorDecision === AssessorDecision.ACCEPT_RECOMMENDATION &&
      input.requestedFinalDisposition === FinalDisposition.SUITABLE_FOR_SIGNOFF;

    if (isUpwardOverrideAttempt || input.assessorDecision === AssessorDecision.PATHWAY_ROUTING_OVERRIDE) {
      // Upward override strictly rejected
      const allowsSecondReview = input.moderationAllowedByPolicy ?? true;
      return {
        workflowState: WorkflowState.REMEDIATION_REQUIRED,
        systemOutcome: RecommendationOutcome.NOT_SUITABLE_FOR_SIGNOFF,
        pathway,
        thresholdPassed,
        assessorDecisionApplied: allowsSecondReview ? AssessorDecision.SECOND_REVIEW_REQUEST : null,
        finalDisposition: null,
        overrideRejected: true,
        rejectionReason: 'Upward override of mandatory or minimum-pass failure is prohibited by policy',
        isSecondReviewRequested: allowsSecondReview
      };
    }

    if (input.assessorDecision === AssessorDecision.ACCEPT_RECOMMENDATION) {
      const disposition = input.requestedFinalDisposition ?? FinalDisposition.NOT_RECOMMENDED;
      return {
        workflowState: WorkflowState.FINAL_REPORT_READY,
        systemOutcome: RecommendationOutcome.NOT_SUITABLE_FOR_SIGNOFF,
        pathway,
        thresholdPassed,
        assessorDecisionApplied: AssessorDecision.ACCEPT_RECOMMENDATION,
        finalDisposition: disposition,
        overrideRejected: false
      };
    }

    return {
      workflowState: WorkflowState.REMEDIATION_REQUIRED,
      systemOutcome: RecommendationOutcome.NOT_SUITABLE_FOR_SIGNOFF,
      pathway,
      thresholdPassed,
      assessorDecisionApplied: null,
      finalDisposition: null,
      overrideRejected: false
    };
  }

  // Rule 9: Every requirement satisfied -> SUITABLE_FOR_SIGNOFF / SIGNOFF_READY
  const systemOutcome = RecommendationOutcome.SUITABLE_FOR_SIGNOFF;

  // Rule 10: Assessor decision on suitable outcome
  if (input.assessorDecision === AssessorDecision.ACCEPT_RECOMMENDATION) {
    return {
      workflowState: WorkflowState.ASSESSOR_DECISION_PENDING,
      systemOutcome,
      pathway,
      thresholdPassed,
      assessorDecisionApplied: AssessorDecision.ACCEPT_RECOMMENDATION,
      finalDisposition: FinalDisposition.SUITABLE_FOR_SIGNOFF,
      overrideRejected: false
    };
  }

  if (input.assessorDecision === AssessorDecision.RECOMMENDATION_OVERRIDE_DOWNGRADE) {
    if (!input.overrideRationale || input.overrideRationale.trim().length === 0) {
      return {
        workflowState: WorkflowState.SIGNOFF_READY,
        systemOutcome,
        pathway,
        thresholdPassed,
        assessorDecisionApplied: null,
        finalDisposition: null,
        overrideRejected: true,
        rejectionReason: 'RECOMMENDATION_OVERRIDE_DOWNGRADE requires documented rationale'
      };
    }
    const downgradeDisposition = input.requestedFinalDisposition ?? FinalDisposition.REASSESSMENT_REQUIRED;
    return {
      workflowState: WorkflowState.FINAL_REPORT_READY,
      systemOutcome,
      pathway,
      thresholdPassed,
      assessorDecisionApplied: AssessorDecision.RECOMMENDATION_OVERRIDE_DOWNGRADE,
      finalDisposition: downgradeDisposition,
      overrideRejected: false
    };
  }

  return {
    workflowState: WorkflowState.SIGNOFF_READY,
    systemOutcome,
    pathway,
    thresholdPassed,
    assessorDecisionApplied: null,
    finalDisposition: null,
    overrideRejected: false
  };
}
