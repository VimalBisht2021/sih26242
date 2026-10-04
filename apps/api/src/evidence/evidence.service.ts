import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { prisma } from '@sih26242/database';
import {
  EvidenceType,
  LocationStatus,
  ProctoringStatus
} from '@sih26242/contracts';
import { computeSha256, checkClockIntegrity } from '@sih26242/shared';
import { EvidenceStorageService } from './evidence-storage.service.js';

export interface SubmitEvidenceDto {
  sessionId?: string;
  assessorId: string;
  taskCode: string;
  evidenceType: EvidenceType;
  fileUri: string;
  sha256?: string;
  fileBase64?: string;
  durationSeconds?: number;
  deviceId?: string;
  
  // Timing
  capturedAtClient: string;
  clientTimezone?: string;
  
  // Geolocation
  latitude?: number;
  longitude?: number;
  locationAccuracyMeters?: number;
  locationStatus?: LocationStatus;
  mockLocationFlag?: boolean;
  geolocationIntegrityFlag?: boolean;

  // Proctoring
  proctoringStatus?: ProctoringStatus;
  proctoringAttestedBy?: string;
}

export interface UploadEvidenceDto {
  sessionId?: string;
  assessorId?: string;
  taskCode?: string;
  evidenceType?: EvidenceType;
  clientSha256?: string;
  capturedAtClient?: string;
  clientTimezone?: string;
  latitude?: number | string;
  longitude?: number | string;
  locationAccuracyMeters?: number | string;
  locationStatus?: LocationStatus;
  mockLocationFlag?: boolean | string;
  geolocationIntegrityFlag?: boolean | string;
  proctoringStatus?: ProctoringStatus;
  proctoringAttestedBy?: string;
  deviceId?: string;
  durationSeconds?: number | string;
}

@Injectable()
export class EvidenceService {
  constructor(private readonly storageService: EvidenceStorageService) {}

  /**
   * Real multipart file upload with client vs server SHA-256 verification,
   * durable storage persistence, and immutable AuditEvent generation.
   */
  async uploadEvidence(
    assessmentId: string,
    taskId: string,
    file: Express.Multer.File,
    dto: UploadEvidenceDto
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Evidence upload error: No file payload provided in multipart request.');
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { sessions: { orderBy: { startedAt: 'desc' } } }
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} not found.`);
    }

    if (assessment.isLocked) {
      throw new BadRequestException('Assessment is LOCKED. Evidence cannot be captured or uploaded.');
    }

    // Validate media format and magic bytes
    const validatedFile = this.storageService.validateFileBuffer(file.buffer, file.mimetype);

    // Compute Authoritative Server SHA-256 Digest
    const serverSha256 = computeSha256(file.buffer);

    // Strict Client SHA-256 Comparison if client provided a precomputed digest
    if (dto.clientSha256) {
      const cleanClient = dto.clientSha256.trim().toLowerCase();
      const cleanServer = serverSha256.toLowerCase();
      if (cleanClient !== cleanServer) {
        throw new BadRequestException(
          `INTEGRITY_MISMATCH: Client SHA-256 (${cleanClient}) does not match authoritative server hash (${cleanServer}). Upload rejected.`
        );
      }
    }

    // Determine or create session
    let session = dto.sessionId
      ? assessment.sessions.find(s => s.id === dto.sessionId || s.sessionCode === dto.sessionId)
      : assessment.sessions[0];

    if (!session) {
      session = await prisma.assessmentSession.create({
        data: {
          sessionCode: `SES-${Date.now().toString(36).toUpperCase()}`,
          assessmentId,
          assessorId: dto.assessorId || 'ASR-01',
          deviceId: dto.deviceId || 'web-client-pwa-01'
        }
      });
    }

    const taskCode = dto.taskCode || taskId;
    const evidenceId = randomUUID();
    const captureId = `CAP-${taskCode.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Store actual bytes in durable storage
    const storageResult = await this.storageService.saveEvidenceFile(
      assessmentId,
      taskCode,
      evidenceId,
      validatedFile.extension,
      file.buffer
    );

    // Clock check
    const clientCapturedAt = dto.capturedAtClient || new Date().toISOString();
    const serverReceivedAt = new Date().toISOString();
    const clockCheck = checkClockIntegrity(clientCapturedAt, serverReceivedAt, 300);

    const evidenceType = dto.evidenceType || (validatedFile.mimeType.startsWith('video/') ? EvidenceType.VIDEO : EvidenceType.IMAGE);

    // Create authoritative database record
    const evidence = await prisma.evidence.create({
      data: {
        id: evidenceId,
        captureId,
        sessionId: session.id,
        assessmentId,
        candidateId: assessment.candidateId,
        assessorId: dto.assessorId || 'ASR-01',
        siteId: assessment.siteId,
        taskCode,
        evidenceType,
        fileUri: storageResult.storageKey,
        sha256: serverSha256,
        durationSeconds: dto.durationSeconds != null ? Number(dto.durationSeconds) : null,
        deviceId: dto.deviceId || 'web-client-pwa-01',
        evidenceVersion: 1,

        capturedAtClient: new Date(clientCapturedAt),
        capturedAtServer: new Date(serverReceivedAt),
        clientTimezone: dto.clientTimezone || 'Asia/Kolkata',
        clockSkewSeconds: clockCheck.clockSkewSeconds,

        latitude: dto.latitude != null ? parseFloat(String(dto.latitude)) : null,
        longitude: dto.longitude != null ? parseFloat(String(dto.longitude)) : null,
        locationAccuracyMeters: dto.locationAccuracyMeters != null ? parseFloat(String(dto.locationAccuracyMeters)) : 10.0,
        locationCapturedAt: new Date(clientCapturedAt),
        locationStatus: dto.locationStatus || LocationStatus.AVAILABLE,
        mockLocationFlag: String(dto.mockLocationFlag) === 'true',
        geolocationIntegrityFlag: String(dto.geolocationIntegrityFlag) !== 'false',

        proctoringStatus: dto.proctoringStatus || ProctoringStatus.VERIFIED,
        proctoringAttestedBy: dto.proctoringAttestedBy || dto.assessorId || 'ASR-01',
        proctoringAttestedAt: new Date(),

        isSynced: true
      }
    });

    // Create Audit Event after successful storage and DB persistence
    await prisma.auditEvent.create({
      data: {
        assessmentId,
        actorId: dto.assessorId || 'ASR-01',
        actorRole: 'ASSESSOR',
        eventType: 'EVIDENCE_CAPTURED',
        entityType: 'Evidence',
        entityId: evidence.id,
        payloadJson: JSON.stringify({
          captureId,
          taskCode,
          storageKey: storageResult.storageKey,
          sha256: serverSha256,
          sizeBytes: storageResult.sizeBytes,
          mimeType: storageResult.mimeType,
          clientSha256Verified: Boolean(dto.clientSha256),
          clockSkewSeconds: clockCheck.clockSkewSeconds,
          isClockDriftFlagged: clockCheck.isDriftFlagged,
          locationStatus: dto.locationStatus || 'AVAILABLE',
          proctoringStatus: dto.proctoringStatus || 'VERIFIED'
        })
      }
    });

    return {
      success: true,
      evidence,
      serverSha256,
      storageKey: storageResult.storageKey,
      clockDriftReviewFlag: clockCheck.isDriftFlagged
    };
  }

  /**
   * Retrieves stored media file for assessment verification and preview rendering.
   */
  async getEvidenceFile(assessmentId: string, evidenceId: string) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId }
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} not found.`);
    }

    const evidence = await prisma.evidence.findFirst({
      where: {
        id: evidenceId,
        assessmentId
      }
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence item ${evidenceId} not found in assessment ${assessmentId}.`);
    }

    const fileData = await this.storageService.getEvidenceFile(evidence.fileUri);
    if (!fileData) {
      throw new NotFoundException(`Physical file for evidence ${evidenceId} not found in durable storage.`);
    }

    return {
      buffer: fileData.buffer,
      mimeType: fileData.mimeType,
      sizeBytes: fileData.sizeBytes,
      sha256: evidence.sha256,
      filename: path.basename(evidence.fileUri)
    };
  }

  /**
   * Backward-compatible JSON evidence submission endpoint.
   */
  async submitEvidence(assessmentId: string, taskId: string, dto: SubmitEvidenceDto) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { sessions: true }
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} not found.`);
    }

    if (assessment.isLocked) {
      throw new BadRequestException('Assessment is LOCKED.');
    }

    // Verify session
    let session = dto.sessionId
      ? assessment.sessions.find(s => s.id === dto.sessionId || s.sessionCode === dto.sessionId)
      : assessment.sessions[0];

    if (!session) {
      session = await prisma.assessmentSession.create({
        data: {
          sessionCode: `SES-${Date.now().toString(36).toUpperCase()}`,
          assessmentId,
          assessorId: dto.assessorId || 'ASR-01',
          deviceId: dto.deviceId || 'web-client-pwa-01'
        }
      });
    }

    // Compute or verify SHA-256
    let calculatedSha256 = dto.sha256;
    let finalFileUri = dto.fileUri;

    if (dto.fileBase64) {
      const buffer = Buffer.from(dto.fileBase64, 'base64');
      calculatedSha256 = computeSha256(buffer);
      if (dto.sha256 && dto.sha256.toLowerCase() !== calculatedSha256.toLowerCase()) {
        throw new BadRequestException('INTEGRITY_MISMATCH: Base64 payload hash does not match declared sha256.');
      }
      const ext = dto.evidenceType === EvidenceType.VIDEO ? 'mp4' : 'jpg';
      const evidenceId = randomUUID();
      const stored = await this.storageService.saveEvidenceFile(
        assessmentId,
        dto.taskCode || taskId,
        evidenceId,
        ext,
        buffer
      );
      finalFileUri = stored.storageKey;
    }

    if (!calculatedSha256) {
      calculatedSha256 = computeSha256(`${dto.fileUri}-${dto.capturedAtClient}-${Date.now()}`);
    }

    // Check clock integrity (Section 29.2)
    const serverReceivedAt = new Date().toISOString();
    const clockCheck = checkClockIntegrity(dto.capturedAtClient, serverReceivedAt, 300);

    const captureId = `CAP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const evidence = await prisma.evidence.create({
      data: {
        captureId,
        sessionId: session.id,
        assessmentId,
        candidateId: assessment.candidateId,
        assessorId: dto.assessorId,
        siteId: assessment.siteId,
        taskCode: dto.taskCode || taskId,
        evidenceType: dto.evidenceType,
        fileUri: finalFileUri,
        sha256: calculatedSha256,
        durationSeconds: dto.durationSeconds ?? null,
        deviceId: dto.deviceId || 'device-01',
        evidenceVersion: 1,

        capturedAtClient: new Date(dto.capturedAtClient),
        capturedAtServer: new Date(serverReceivedAt),
        clientTimezone: dto.clientTimezone || 'Asia/Kolkata',
        clockSkewSeconds: clockCheck.clockSkewSeconds,

        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        locationAccuracyMeters: dto.locationAccuracyMeters ?? null,
        locationCapturedAt: new Date(dto.capturedAtClient),
        locationStatus: dto.locationStatus || LocationStatus.AVAILABLE,
        mockLocationFlag: dto.mockLocationFlag || false,
        geolocationIntegrityFlag: dto.geolocationIntegrityFlag ?? true,

        proctoringStatus: dto.proctoringStatus || ProctoringStatus.VERIFIED,
        proctoringAttestedBy: dto.proctoringAttestedBy || dto.assessorId,
        proctoringAttestedAt: new Date(),

        isSynced: true
      }
    });

    // Create Audit Event
    await prisma.auditEvent.create({
      data: {
        assessmentId,
        actorId: dto.assessorId,
        actorRole: 'ASSESSOR',
        eventType: 'EVIDENCE_CAPTURED',
        entityType: 'Evidence',
        entityId: evidence.id,
        payloadJson: JSON.stringify({
          captureId,
          taskCode: dto.taskCode,
          sha256: calculatedSha256,
          clockSkewSeconds: clockCheck.clockSkewSeconds,
          isClockDriftFlagged: clockCheck.isDriftFlagged,
          locationStatus: dto.locationStatus,
          proctoringStatus: dto.proctoringStatus
        })
      }
    });

    return {
      success: true,
      evidence,
      clockDriftReviewFlag: clockCheck.isDriftFlagged
    };
  }
}
