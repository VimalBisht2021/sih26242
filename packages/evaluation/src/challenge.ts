export interface ChallengePerturbation {
  caseId: string;
  originalSuggestion: number;
  perturbedSuggestion: number;
  perturbationType: 'INFLATED_MARK' | 'WRONG_CRITERION_LINK' | 'UNSUPPORTED_CLAIM';
  rationale: string;
  debriefRecorded: boolean;
}

export function generateWrongAiPerturbation(
  caseId: string,
  actualScore: number
): ChallengePerturbation {
  // Deliberately inflate score or distort rating
  const perturbedSuggestion = Math.min(actualScore + 4, 10);
  return {
    caseId,
    originalSuggestion: actualScore,
    perturbedSuggestion,
    perturbationType: 'INFLATED_MARK',
    rationale: 'Controlled perturbation for automation bias challenge testing.',
    debriefRecorded: false
  };
}
