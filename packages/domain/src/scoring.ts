import { AssessmentComponentType, CriterionStatus } from '@sih26242/contracts';

export interface CriterionScoringInput {
  criterionId: string;
  mandatory: boolean;
  status: CriterionStatus;
  theoryMarks: number;
  practicalMarks: number;
  vivaMarks: number;
  projectMarks?: number;
  maxTheoryMarks: number;
  maxPracticalMarks: number;
  maxVivaMarks: number;
  maxProjectMarks?: number;
}

export interface SchemeComponentRule {
  type: AssessmentComponentType;
  maxMarks: number;
  minPassMarks?: number;
  minPassPercentage?: number;
}

export interface ScoringResult {
  theoryScore: number;
  practicalScore: number;
  vivaScore: number;
  projectScore: number;
  totalScore: number;
  maxScore: number;
  scorePercentage: number;
  componentTotals: Record<AssessmentComponentType, { max: number; awarded: number }>;
  qualifyingRulePassed: boolean;
  mandatoryCriteriaCount: number;
  mandatoryCriteriaSatisfied: number;
  mandatoryCriteriaPass: boolean;
  unresolvedMandatoryCount: number;
}

/**
 * Calculates score from assessor-approved criterion decisions according to the official QP scheme.
 */
export function calculateOfficialScore(
  criteria: CriterionScoringInput[],
  scheme: {
    aggregatePassPercentage: number;
    components: SchemeComponentRule[];
  }
): ScoringResult {
  let theoryScore = 0;
  let practicalScore = 0;
  let vivaScore = 0;
  let projectScore = 0;

  let maxTheory = 0;
  let maxPractical = 0;
  let maxViva = 0;
  let maxProject = 0;

  let mandatoryCount = 0;
  let mandatorySatisfied = 0;
  let unresolvedMandatory = 0;

  for (const c of criteria) {
    theoryScore += Math.min(c.theoryMarks, c.maxTheoryMarks);
    practicalScore += Math.min(c.practicalMarks, c.maxPracticalMarks);
    vivaScore += Math.min(c.vivaMarks, c.maxVivaMarks);
    projectScore += Math.min(c.projectMarks ?? 0, c.maxProjectMarks ?? 0);

    maxTheory += c.maxTheoryMarks;
    maxPractical += c.maxPracticalMarks;
    maxViva += c.maxVivaMarks;
    maxProject += c.maxProjectMarks ?? 0;

    if (c.mandatory) {
      mandatoryCount++;
      if (c.status === CriterionStatus.DEMONSTRATED || c.status === CriterionStatus.MEETS_ANCHOR) {
        mandatorySatisfied++;
      } else if (c.status === CriterionStatus.PARTIAL) {
        // Partial does not meet mandatory demonstration threshold
      } else if (c.status === CriterionStatus.NOT_DEMONSTRATED) {
        // Not demonstrated
      } else {
        unresolvedMandatory++;
      }
    }
  }

  const totalScore = theoryScore + practicalScore + vivaScore + projectScore;
  const maxScore = maxTheory + maxPractical + maxViva + maxProject;
  const scorePercentage = maxScore > 0 ? Number(((totalScore / maxScore) * 100).toFixed(2)) : 0;

  // Evaluate qualifying rule
  let qualifyingRulePassed = scorePercentage >= scheme.aggregatePassPercentage;

  // Evaluate any component-wise minimums if present
  const componentTotals: Record<AssessmentComponentType, { max: number; awarded: number }> = {
    [AssessmentComponentType.THEORY]: { max: maxTheory, awarded: theoryScore },
    [AssessmentComponentType.PRACTICAL]: { max: maxPractical, awarded: practicalScore },
    [AssessmentComponentType.VIVA]: { max: maxViva, awarded: vivaScore },
    [AssessmentComponentType.PROJECT]: { max: maxProject, awarded: projectScore },
    [AssessmentComponentType.OTHER]: { max: 0, awarded: 0 }
  };

  for (const comp of scheme.components) {
    const compTotal = componentTotals[comp.type];
    if (compTotal) {
      if (comp.minPassMarks !== undefined && compTotal.awarded < comp.minPassMarks) {
        qualifyingRulePassed = false;
      }
      if (comp.minPassPercentage !== undefined) {
        const compPct = compTotal.max > 0 ? (compTotal.awarded / compTotal.max) * 100 : 0;
        if (compPct < comp.minPassPercentage) {
          qualifyingRulePassed = false;
        }
      }
    }
  }

  const mandatoryCriteriaPass = mandatoryCount > 0 ? mandatorySatisfied === mandatoryCount : true;

  return {
    theoryScore,
    practicalScore,
    vivaScore,
    projectScore,
    totalScore,
    maxScore,
    scorePercentage,
    componentTotals,
    qualifyingRulePassed,
    mandatoryCriteriaCount: mandatoryCount,
    mandatoryCriteriaSatisfied: mandatorySatisfied,
    mandatoryCriteriaPass,
    unresolvedMandatoryCount: unresolvedMandatory
  };
}
