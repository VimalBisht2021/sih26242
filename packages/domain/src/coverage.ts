export interface CoverageMetrics {
  mappedExperientialCoverage: number;
  assessedCoverage: number;
  demonstratedCoverage: number;
}

/**
 * Calculates Mapped Experiential Coverage:
 * Qualification learning outcomes supported by pre-assessment experience mapping / total applicable learning outcomes
 */
export function calculateMappedExperientialCoverage(
  supportedLearningOutcomeIds: string[],
  totalApplicableLearningOutcomeIds: string[]
): number {
  if (totalApplicableLearningOutcomeIds.length === 0) return 0;
  const uniqueSupported = new Set(supportedLearningOutcomeIds);
  const matchedCount = totalApplicableLearningOutcomeIds.filter(id => uniqueSupported.has(id)).length;
  return Number(((matchedCount / totalApplicableLearningOutcomeIds.length) * 100).toFixed(2));
}

/**
 * Calculates Assessed Coverage:
 * Applicable criteria with an explicit assessment decision / total applicable criteria
 */
export function calculateAssessedCoverage(
  assessedCriteriaIds: string[],
  totalApplicableCriteriaIds: string[]
): number {
  if (totalApplicableCriteriaIds.length === 0) return 0;
  const uniqueAssessed = new Set(assessedCriteriaIds);
  const assessedCount = totalApplicableCriteriaIds.filter(id => uniqueAssessed.has(id)).length;
  return Number(((assessedCount / totalApplicableCriteriaIds.length) * 100).toFixed(2));
}

/**
 * Calculates Demonstrated Coverage:
 * Applicable criteria accepted as demonstrated based on assessor-approved decisions / total applicable criteria
 */
export function calculateDemonstratedCoverage(
  demonstratedCriteriaIds: string[],
  totalApplicableCriteriaIds: string[]
): number {
  if (totalApplicableCriteriaIds.length === 0) return 0;
  const uniqueDemonstrated = new Set(demonstratedCriteriaIds);
  const demonstratedCount = totalApplicableCriteriaIds.filter(id => uniqueDemonstrated.has(id)).length;
  return Number(((demonstratedCount / totalApplicableCriteriaIds.length) * 100).toFixed(2));
}
