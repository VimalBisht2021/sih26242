import { ModelGovernanceRecord } from '@sih26242/contracts';
import { computeSha256 } from '@sih26242/shared';

export interface CreateGovernanceRecordInput {
  modelName: string;
  modelVersion: string;
  promptVersion: string;
  qualificationSourceId: string;
  qualificationChecksum: string;
  assessmentSchemeVersion: string;
  assessmentPolicyVersion: string;
  retrievedPassageIds: string[];
  inputPayload: any;
  outputPayload: any;
}

export function buildModelGovernanceRecord(input: CreateGovernanceRecordInput): ModelGovernanceRecord {
  const inputHash = computeSha256(JSON.stringify(input.inputPayload));
  const outputHash = computeSha256(JSON.stringify(input.outputPayload));

  return {
    modelName: input.modelName,
    modelVersion: input.modelVersion,
    promptVersion: input.promptVersion,
    qualificationSourceId: input.qualificationSourceId,
    qualificationChecksum: input.qualificationChecksum,
    assessmentSchemeVersion: input.assessmentSchemeVersion,
    assessmentPolicyVersion: input.assessmentPolicyVersion,
    retrievedPassageIds: input.retrievedPassageIds,
    inputHash,
    outputHash,
    executedAt: new Date().toISOString()
  };
}
