import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@sih26242/database';
import { computeSha256, computePayloadHash, checkClockIntegrity } from '@sih26242/shared';

export interface SyncBatchItemDto {
  eventId: string;
  deviceId: string;
  entityType: string;
  entityId: string;
  operation: 'CREATE' | 'UPDATE';
  baseVersion: number;
  clientSequence: number;
  payload: any;
  payloadHash?: string;
  createdAt: string; // ISO string from client
  assessmentId?: string;
  actorId?: string;
}

export interface SyncBatchDto {
  deviceId: string;
  items: SyncBatchItemDto[];
}

@Injectable()
export class SyncService {
  async processBatch(dto: SyncBatchDto) {
    if (!dto || !Array.isArray(dto.items)) {
      const parsed = typeof dto === 'string' ? JSON.parse(dto) : dto;
      if (!parsed?.items || !Array.isArray(parsed.items)) {
        throw new BadRequestException('Sync payload must include items array.');
      }
      dto = parsed;
    }

    const results: any[] = [];

    for (const item of dto.items) {

      // 1. Deduplication check via eventId
      const existing = await prisma.syncEvent.findUnique({
        where: { eventId: item.eventId }
      });

      if (existing) {
        results.push({
          eventId: item.eventId,
          status: 'DUPLICATE',
          serverVersion: existing.serverVersion,
          message: 'Event was already applied idempotently.'
        });
        continue;
      }

      // 2. Validate payload hash
      const calculatedHash = computePayloadHash(item.payload);
      if (item.payloadHash && item.payloadHash !== calculatedHash) {
        results.push({
          eventId: item.eventId,
          status: 'HASH_MISMATCH',
          message: 'Payload hash does not match computed SHA-256.'
        });
        continue;
      }

      // 3. Check Clock Integrity
      const clientTime = new Date(item.createdAt);
      const serverTime = new Date();
      const clockCheck = checkClockIntegrity(item.createdAt, serverTime.toISOString(), 300); // 5 min threshold
      const clockSkewSeconds = clockCheck.clockSkewSeconds;
      const withinThreshold = !clockCheck.isDriftFlagged;


      // 4. Process entity operation
      let appliedStatus = 'APPLIED';
      let entityVersion = item.baseVersion + 1;

      try {
        if (item.entityType === 'Evidence') {
          // Check if evidence already exists
          const existingEv = await prisma.evidence.findUnique({
            where: { captureId: item.payload.captureId || item.entityId }
          });

          if (!existingEv) {
            let actualSessionId = item.payload.sessionId;
            let sessionObj = await prisma.assessmentSession.findFirst({
              where: {
                OR: [
                  { id: item.payload.sessionId || '' },
                  { sessionCode: item.payload.sessionId || '' }
                ]
              }
            });

            if (!sessionObj && item.payload.assessmentId) {
              sessionObj = await prisma.assessmentSession.findFirst({
                where: { assessmentId: item.payload.assessmentId },
                orderBy: { startedAt: 'desc' }
              });

              if (!sessionObj) {
                sessionObj = await prisma.assessmentSession.create({
                  data: {
                    sessionCode: `SES-${Date.now().toString(36).toUpperCase()}`,
                    assessmentId: item.payload.assessmentId,
                    assessorId: item.payload.assessorId || 'ASR-01',
                    deviceId: item.deviceId || 'web-client-pwa-01'
                  }
                });
              }
            }

            if (sessionObj) {
              actualSessionId = sessionObj.id;
            }

            let actualSiteId = item.payload.siteId || 'SITE-01';
            const siteExists = await prisma.site.findUnique({
              where: { siteId: actualSiteId }
            });
            if (!siteExists) {
              const defaultSite = await prisma.site.findFirst();
              actualSiteId = defaultSite ? defaultSite.siteId : 'SITE-01';
            }

            await prisma.evidence.create({
              data: {
                id: item.entityId,
                captureId: item.payload.captureId || item.entityId,
                sessionId: actualSessionId,
                assessmentId: item.payload.assessmentId,

                candidateId: item.payload.candidateId,
                assessorId: item.payload.assessorId,
                siteId: actualSiteId,
                taskCode: item.payload.taskCode,
                evidenceType: item.payload.evidenceType || 'IMAGE',
                fileUri: item.payload.fileUri || 'mock://stored-media',
                sha256: item.payload.sha256 || computeSha256(JSON.stringify(item.payload)),
                durationSeconds: item.payload.durationSeconds ?? null,
                deviceId: item.deviceId,
                evidenceVersion: 1,
                capturedAtClient: clientTime,
                capturedAtServer: serverTime,
                clientTimezone: item.payload.clientTimezone || 'Asia/Kolkata',
                clockSkewSeconds,
                latitude: item.payload.latitude ?? null,
                longitude: item.payload.longitude ?? null,
                locationAccuracyMeters: item.payload.locationAccuracyMeters ?? 10.0,
                locationCapturedAt: item.payload.locationCapturedAt ? new Date(item.payload.locationCapturedAt) : clientTime,
                locationStatus: item.payload.locationStatus || 'AVAILABLE',
                mockLocationFlag: item.payload.mockLocationFlag ?? false,
                geolocationIntegrityFlag: item.payload.geolocationIntegrityFlag ?? true,
                proctoringStatus: item.payload.proctoringStatus || 'VERIFIED',
                proctoringAttestedBy: item.payload.proctoringAttestedBy || item.payload.assessorId,
                proctoringAttestedAt: item.payload.proctoringAttestedAt ? new Date(item.payload.proctoringAttestedAt) : serverTime,
                isSynced: true
              }
            });
          }
        } else if (item.entityType === 'CriterionAssessment') {
          // Update criterion assessment
          const existingCrit = await prisma.criterionAssessment.findUnique({
            where: {
              assessmentId_criterionId: {
                assessmentId: item.payload.assessmentId,
                criterionId: item.payload.criterionId
              }
            }
          });

          if (existingCrit) {
            await prisma.criterionAssessment.update({
              where: { id: existingCrit.id },
              data: {
                status: item.payload.status,
                practicalMarks: item.payload.practicalMarks ?? existingCrit.practicalMarks,
                theoryMarks: item.payload.theoryMarks ?? existingCrit.theoryMarks,
                vivaMarks: item.payload.vivaMarks ?? existingCrit.vivaMarks,
                totalAwardedMarks:
                  (item.payload.practicalMarks ?? existingCrit.practicalMarks) +
                  (item.payload.theoryMarks ?? existingCrit.theoryMarks) +
                  (item.payload.vivaMarks ?? existingCrit.vivaMarks),
                assessorNote: item.payload.assessorNote ?? existingCrit.assessorNote,
                evidenceOpened: item.payload.evidenceOpened ?? true
              }
            });
          }
        }

        // Record SyncEvent record
        const syncEvent = await prisma.syncEvent.create({
          data: {
            eventId: item.eventId,
            deviceId: item.deviceId,
            entityType: item.entityType,
            entityId: item.entityId,
            operation: item.operation,
            baseVersion: item.baseVersion,
            clientSequence: item.clientSequence,
            payloadHash: calculatedHash,
            serverVersion: entityVersion
          }
        });

        // Record Audit event
        await prisma.auditEvent.create({
          data: {
            assessmentId: item.assessmentId ?? item.payload.assessmentId ?? null,
            actorId: item.actorId ?? item.deviceId,
            actorRole: 'DEVICE_SYNC',
            eventType: withinThreshold ? 'SYNC_APPLIED' : 'SYNC_APPLIED_CLOCK_DRIFT_REVIEW',
            entityType: item.entityType,
            entityId: item.entityId,
            payloadJson: JSON.stringify({
              eventId: item.eventId,
              deviceId: item.deviceId,
              clockSkewSeconds,
              clockDriftFlag: !withinThreshold
            })
          }
        });

        results.push({
          eventId: item.eventId,
          status: withinThreshold ? 'APPLIED' : 'APPLIED_WITH_CLOCK_DRIFT',
          serverVersion: entityVersion,
          clockSkewSeconds,
          clockDriftReview: !withinThreshold
        });

      } catch (err: any) {
        results.push({
          eventId: item.eventId,
          status: 'ERROR',
          message: err.message
        });
      }
    }

    return {
      success: true,
      deviceId: dto.deviceId,
      processedCount: results.length,
      results
    };
  }

  async getChanges(cursor?: number) {
    const minVersion = cursor ? Number(cursor) : 0;
    const events = await prisma.syncEvent.findMany({
      where: {
        serverVersion: { gt: minVersion }
      },
      orderBy: { serverVersion: 'asc' },
      take: 100
    });

    const latestVersion = events.length > 0 ? events[events.length - 1].serverVersion : minVersion;

    return {
      success: true,
      cursor: latestVersion,
      events
    };
  }
}
