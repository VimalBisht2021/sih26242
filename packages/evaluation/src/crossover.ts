export interface EvaluationCase {
  caseId: string;
  candidateName: string;
  qualificationCode: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  language: string;
  siteId: string;
  evidenceType: 'VIDEO' | 'IMAGE';
  expertReferenceScore: number;
  isChallengeCase: boolean;
  hasSyntheticMediaConsent: boolean;
}

export interface CaseAssignment {
  assessorId: string;
  caseId: string;
  condition: 'MANUAL_ONLY' | 'AI_ASSISTED';
  form: 'A' | 'B';
  scheduledSessionOrder: number;
}

/**
 * Implements Balanced Crossover Allocation (Section 34):
 * - 4 Assessors
 * - Split cases into matched Forms A and B
 * - Assessor 1 & 2: Manual on Form A -> Washout -> AI on Form B
 * - Assessor 3 & 4: Manual on Form B -> Washout -> AI on Form A
 * - Exactly 2 ratings per condition per case
 * - No same-assessor repeated cases
 */
export function generateBalancedCrossoverAssignments(
  cases: EvaluationCase[],
  assessorIds: string[] = ['assessor-1', 'assessor-2', 'assessor-3', 'assessor-4']
): CaseAssignment[] {
  if (assessorIds.length !== 4) {
    throw new Error('Primary balanced crossover requires exactly 4 assessors.');
  }

  // Split cases into matched Form A and Form B
  const formA: EvaluationCase[] = [];
  const formB: EvaluationCase[] = [];

  cases.forEach((c, index) => {
    if (index % 2 === 0) {
      formA.push(c);
    } else {
      formB.push(c);
    }
  });

  const assignments: CaseAssignment[] = [];

  // Assessor 1 & 2: Manual -> Form A, AI -> Form B
  for (const assessorId of [assessorIds[0], assessorIds[1]]) {
    let order = 1;
    for (const c of formA) {
      assignments.push({
        assessorId,
        caseId: c.caseId,
        condition: 'MANUAL_ONLY',
        form: 'A',
        scheduledSessionOrder: order++
      });
    }
    for (const c of formB) {
      assignments.push({
        assessorId,
        caseId: c.caseId,
        condition: 'AI_ASSISTED',
        form: 'B',
        scheduledSessionOrder: order++
      });
    }
  }

  // Assessor 3 & 4: Manual -> Form B, AI -> Form A
  for (const assessorId of [assessorIds[2], assessorIds[3]]) {
    let order = 1;
    for (const c of formB) {
      assignments.push({
        assessorId,
        caseId: c.caseId,
        condition: 'MANUAL_ONLY',
        form: 'B',
        scheduledSessionOrder: order++
      });
    }
    for (const c of formA) {
      assignments.push({
        assessorId,
        caseId: c.caseId,
        condition: 'AI_ASSISTED',
        form: 'A',
        scheduledSessionOrder: order++
      });
    }
  }

  return assignments;
}

/**
 * Validates the >= 48 hour washout period between an assessor's manual and AI session.
 */
export function validateWashoutPeriod(
  manualCompletedAt: string,
  aiStartedAt: string,
  requiredHours: number = 48
): { isValid: boolean; actualHours: number } {
  const manualTime = new Date(manualCompletedAt).getTime();
  const aiTime = new Date(aiStartedAt).getTime();
  const actualHours = Number(((aiTime - manualTime) / (1000 * 60 * 60)).toFixed(2));

  return {
    isValid: actualHours >= requiredHours,
    actualHours
  };
}
