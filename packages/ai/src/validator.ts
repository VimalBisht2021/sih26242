import { EvidenceObservationClaim } from '@sih26242/contracts';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates that an AI observation conforms strictly to Section 22-23 invariants:
 * - Must reference at least one evidenceId
 * - Must reference a valid criterionId
 * - Timestamps if present must be non-negative and start <= end
 * - Observation text must not be empty
 */
export function validateAIObservation(claim: EvidenceObservationClaim): ValidationResult {
  const errors: string[] = [];

  if (!claim.criterionId || claim.criterionId.trim().length === 0) {
    errors.push('AI claim invalid: criterionId is missing or empty.');
  }

  if (!claim.evidenceRefs || claim.evidenceRefs.length === 0) {
    errors.push(`AI claim invalid for ${claim.criterionId}: no evidence references provided. Ungrounded AI claims are rejected.`);
  } else {
    for (const ref of claim.evidenceRefs) {
      if (!ref.evidenceId || ref.evidenceId.trim().length === 0) {
        errors.push(`AI claim invalid: empty evidenceId reference in claim for ${claim.criterionId}.`);
      }
      if (ref.timestampStart !== undefined && ref.timestampEnd !== undefined) {
        if (ref.timestampStart < 0 || ref.timestampEnd < 0) {
          errors.push('AI claim invalid: timestamps cannot be negative.');
        }
        if (ref.timestampStart > ref.timestampEnd) {
          errors.push(`AI claim invalid: timestampStart (${ref.timestampStart}) exceeds timestampEnd (${ref.timestampEnd}).`);
        }
      }
    }
  }

  if (!claim.observation || claim.observation.trim().length === 0) {
    errors.push(`AI claim invalid for ${claim.criterionId}: observation text is empty.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
