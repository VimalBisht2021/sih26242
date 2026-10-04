import { WorkflowState } from '@sih26242/contracts';

export interface TransitionRule {
  from: WorkflowState;
  to: WorkflowState;
  description: string;
}

export const AUTHORITATIVE_TRANSITIONS: TransitionRule[] = [
  {
    from: WorkflowState.MAPPING_PENDING,
    to: WorkflowState.PATHWAY_SELECTED,
    description: 'Qualification match and required applicant context complete; no pending threshold confirmation'
  },
  {
    from: WorkflowState.MAPPING_PENDING,
    to: WorkflowState.PATHWAY_CONFIRMATION_PENDING,
    description: 'Threshold pathway selected and coverage unconfirmed, or required education/enrolment context missing'
  },
  {
    from: WorkflowState.PATHWAY_CONFIRMATION_PENDING,
    to: WorkflowState.PATHWAY_SELECTED,
    description: 'Assessor confirms or edits pathway inputs/coverage'
  },
  {
    from: WorkflowState.PATHWAY_SELECTED,
    to: WorkflowState.ASSESSMENT_READY,
    description: 'Selected pathway requires direct assessment'
  },
  {
    from: WorkflowState.PATHWAY_SELECTED,
    to: WorkflowState.ASSESSOR_DECISION_PENDING,
    description: 'System outcome is UPSKILLING_REQUIRED and assessor initiates referral decision'
  },
  {
    from: WorkflowState.ASSESSMENT_READY,
    to: WorkflowState.ASSESSMENT_IN_PROGRESS,
    description: 'Assessor starts supervised assessment session'
  },
  {
    from: WorkflowState.ASSESSMENT_IN_PROGRESS,
    to: WorkflowState.CRITERION_RESOLUTION_REQUIRED,
    description: 'Mandatory criterion is unresolved; pauses finalization'
  },
  {
    from: WorkflowState.CRITERION_RESOLUTION_REQUIRED,
    to: WorkflowState.ASSESSMENT_IN_PROGRESS,
    description: 'Mandatory criterion resolved and assessment resumes'
  },
  {
    from: WorkflowState.ASSESSMENT_IN_PROGRESS,
    to: WorkflowState.SIGNOFF_READY,
    description: 'All required evidence/criteria complete and pass conditions satisfied'
  },
  {
    from: WorkflowState.ASSESSMENT_IN_PROGRESS,
    to: WorkflowState.REMEDIATION_REQUIRED,
    description: 'Mandatory failure or official minimum-pass failure evaluated'
  },
  {
    from: WorkflowState.REMEDIATION_REQUIRED,
    to: WorkflowState.ASSESSOR_DECISION_PENDING,
    description: 'Assessor prepares negative/remediation referral'
  },
  {
    from: WorkflowState.REMEDIATION_REQUIRED,
    to: WorkflowState.ASSESSMENT_READY,
    description: 'Official reassessment workflow begins as a new attempt'
  },
  {
    from: WorkflowState.SIGNOFF_READY,
    to: WorkflowState.ASSESSOR_DECISION_PENDING,
    description: 'Assessor opens final sign-off decision'
  },
  {
    from: WorkflowState.SIGNOFF_READY,
    to: WorkflowState.ASSESSMENT_IN_PROGRESS,
    description: 'Assessor requests more evidence (reopen)'
  },
  {
    from: WorkflowState.ASSESSOR_DECISION_PENDING,
    to: WorkflowState.ASSESSMENT_IN_PROGRESS,
    description: 'Assessor reopens assessment for additional evidence'
  },
  {
    from: WorkflowState.ASSESSOR_DECISION_PENDING,
    to: WorkflowState.SIGNED_OFF,
    description: 'Authorized positive finalization of suitable recommendation'
  },
  {
    from: WorkflowState.ASSESSOR_DECISION_PENDING,
    to: WorkflowState.FINAL_REPORT_READY,
    description: 'Authorized negative/referral finalization accepted'
  },
  {
    from: WorkflowState.FINAL_REPORT_READY,
    to: WorkflowState.REPORT_FINALIZED_NOT_RECOMMENDED,
    description: 'Negative report validated and saved'
  },
  {
    from: WorkflowState.SIGNED_OFF,
    to: WorkflowState.LOCKED,
    description: 'Terminal positive record locked immutably'
  },
  {
    from: WorkflowState.REPORT_FINALIZED_NOT_RECOMMENDED,
    to: WorkflowState.LOCKED,
    description: 'Terminal negative/referral record locked immutably'
  }
];

/**
 * Validates whether a state transition is legal according to Section 26.
 */
export function validateStateTransition(
  fromState: WorkflowState,
  toState: WorkflowState
): { valid: boolean; reason?: string } {
  if (fromState === toState) {
    return { valid: true };
  }

  // Once LOCKED, no normal transitions are allowed
  if (fromState === WorkflowState.LOCKED) {
    return {
      valid: false,
      reason: `Record is LOCKED. No state mutation allowed on locked historical record.`
    };
  }

  const match = AUTHORITATIVE_TRANSITIONS.find(
    t => t.from === fromState && t.to === toState
  );

  if (!match) {
    return {
      valid: false,
      reason: `Illegal state transition from ${fromState} to ${toState}. Not defined in authoritative transition table.`
    };
  }

  return { valid: true };
}
