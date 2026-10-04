export interface SyncEvent<T = any> {
  eventId: string;
  deviceId: string;
  entityType: 'Evidence' | 'CriterionAssessment' | 'AssessmentSession' | 'ExperienceStatement';
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  baseVersion: number;
  clientSequence: number;
  payload: T;
  payloadHash: string; // sha256 of payload
  createdAt: string;   // client timestamp
}

export interface SyncBatchRequest {
  deviceId: string;
  assessorId: string;
  events: SyncEvent[];
  clientSentAt: string;
}

export interface SyncResult {
  eventId: string;
  entityId: string;
  status: 'APPLIED' | 'CONFLICT' | 'DEDUPLICATED' | 'REJECTED';
  serverVersion: number;
  serverReceivedAt: string;
  clockSkewSeconds: number;
  error?: string;
}

export interface SyncBatchResponse {
  success: boolean;
  syncedCount: number;
  results: SyncResult[];
  serverTime: string;
  clockDriftWarning: boolean;
}
