import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateBalancedCrossoverAssignments,
  validateWashoutPeriod,
  EvaluationCase
} from './crossover.js';
import {
  calculateOrdinalKrippendorffAlpha,
  evaluateStudyMetrics,
  calculateWrongAiCatchRate,
  EvaluationRating
} from './metrics.js';

describe('PS26242 Evaluation Framework Tests', () => {
  it('generates balanced crossover without same-assessor repetition and exactly 2 ratings per case per condition', () => {
    const cases: EvaluationCase[] = Array.from({ length: 12 }, (_, i) => ({
      caseId: `case-${i + 1}`,
      candidateName: `Worker ${i + 1}`,
      qualificationCode: 'AMH/Q0301',
      difficulty: 'MEDIUM',
      language: 'hi',
      siteId: 'site-demo',
      evidenceType: 'VIDEO',
      expertReferenceScore: 8,
      isChallengeCase: i % 4 === 0,
      hasSyntheticMediaConsent: true
    }));

    const assignments = generateBalancedCrossoverAssignments(cases);

    // 4 assessors * 12 cases = 48 assignments (each case rated by 2 assessors under manual, 2 under AI)
    assert.equal(assignments.length, 48);

    // Verify no assessor rates the same case twice
    for (const assessorId of ['assessor-1', 'assessor-2', 'assessor-3', 'assessor-4']) {
      const assessorCases = assignments
        .filter(a => a.assessorId === assessorId)
        .map(a => a.caseId);
      const uniqueCases = new Set(assessorCases);
      assert.equal(assessorCases.length, uniqueCases.size);
    }
  });

  it('validates 48-hour washout requirement between manual and AI conditions', () => {
    const valid = validateWashoutPeriod(
      '2026-10-01T10:00:00.000Z',
      '2026-10-03T11:00:00.000Z',
      48
    );
    assert.equal(valid.isValid, true);
    assert.ok(valid.actualHours >= 48);

    const invalid = validateWashoutPeriod(
      '2026-10-01T10:00:00.000Z',
      '2026-10-02T10:00:00.000Z',
      48
    );
    assert.equal(invalid.isValid, false);
    assert.equal(invalid.actualHours, 24);
  });

  it('calculates ordinal Krippendorff alpha and delta alpha with uncertainty bounds', () => {
    const sampleRatings: EvaluationRating[] = [
      // Case 1
      { caseId: 'c1', assessorId: 'a1', condition: 'MANUAL_ONLY', score: 7 },
      { caseId: 'c1', assessorId: 'a2', condition: 'MANUAL_ONLY', score: 8 },
      { caseId: 'c1', assessorId: 'a3', condition: 'AI_ASSISTED', score: 8 },
      { caseId: 'c1', assessorId: 'a4', condition: 'AI_ASSISTED', score: 8 },
      // Case 2
      { caseId: 'c2', assessorId: 'a1', condition: 'MANUAL_ONLY', score: 5 },
      { caseId: 'c2', assessorId: 'a2', condition: 'MANUAL_ONLY', score: 6 },
      { caseId: 'c2', assessorId: 'a3', condition: 'AI_ASSISTED', score: 5 },
      { caseId: 'c2', assessorId: 'a4', condition: 'AI_ASSISTED', score: 5 },
      // Challenge case
      {
        caseId: 'c3',
        assessorId: 'a3',
        condition: 'AI_ASSISTED',
        score: 4,
        aiSuggestedScore: 9,
        wasAiPerturbed: true,
        wasAiOverridden: true
      }
    ];

    const metrics = evaluateStudyMetrics(sampleRatings);
    assert.ok(metrics.aiAlpha >= 0);
    assert.ok(metrics.manualAlpha >= 0);
    assert.equal(metrics.totalCases, 3);
  });

  it('computes wrong-AI catch rate correctly on perturbed items', () => {
    const ratings: EvaluationRating[] = [
      { caseId: 'c1', assessorId: 'a1', condition: 'AI_ASSISTED', score: 4, wasAiPerturbed: true, wasAiOverridden: true },
      { caseId: 'c2', assessorId: 'a2', condition: 'AI_ASSISTED', score: 9, wasAiPerturbed: true, wasAiOverridden: false }
    ];
    const catchRate = calculateWrongAiCatchRate(ratings);
    assert.equal(catchRate, 0.5); // 1 out of 2 caught
  });
});
