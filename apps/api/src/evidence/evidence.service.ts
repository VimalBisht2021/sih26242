import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@sih26242/database';
import {
  EvidenceType,
  LocationStatus,
  ProctoringStatus
} from '@sih26242/contracts';
import { computeSha256, checkClockIntegrity } from '@sih26242/shared';

export interface SubmitEvidenceDto {
  sessionId: string;
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

@Injectable()
export class EvidenceService {
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
    const session = assessment.sessions.find(s => s.id === dto.sessionId || s.sessionCode === dto.sessionId);
    if (!session) {
      throw new BadRequestException(`Session ${dto.sessionId} does not belong to assessment ${assessmentId}.`);
    }

    // Compute or verify SHA-256
    let calculatedSha256 = dto.sha256;
    if (!calculatedSha256 && dto.fileBase64) {
      calculatedSha256 = computeSha256(Buffer.from(dto.fileBase64, 'base64'));
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
        fileUri: dto.fileUri,
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
