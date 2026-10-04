import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@sih26242/database';
import { CriterionStatus } from '@sih26242/contracts';

export interface UpdateCriterionAssessmentDto {
  assessorId: string;
  status: CriterionStatus;
  theoryMarks?: number;
  practicalMarks?: number;
  vivaMarks?: number;
  assessorNote?: string;
  evidenceOpened?: boolean;
}

@Injectable()
export class CriteriaService {
  async updateCriterionAssessment(
    assessmentId: string,
    criterionId: string,
    dto: UpdateCriterionAssessmentDto
  ) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId }
    });
    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} not found.`);
    }
    if (assessment.isLocked) {
      throw new BadRequestException('Assessment is LOCKED.');
    }

    const criterion = await prisma.criterion.findUnique({
      where: { id: criterionId }
    });
    if (!criterion) {
      throw new NotFoundException(`Criterion ${criterionId} not found.`);
    }

    // Verify marks do not exceed maximums
    const practical = dto.practicalMarks ?? 0;
    const theory = dto.theoryMarks ?? 0;
    const viva = dto.vivaMarks ?? 0;

    if (practical > criterion.practicalMarks) {
      throw new BadRequestException(
        `Practical marks (${practical}) exceed maximum allowed (${criterion.practicalMarks}) for ${criterion.code}.`
      );
    }
    if (theory > criterion.theoryMarks) {
      throw new BadRequestException(
        `Theory marks (${theory}) exceed maximum allowed (${criterion.theoryMarks}) for ${criterion.code}.`
      );
    }
    if (viva > criterion.vivaMarks) {
      throw new BadRequestException(
        `Viva marks (${viva}) exceed maximum allowed (${criterion.vivaMarks}) for ${criterion.code}.`
      );
    }

    const totalAwarded = practical + theory + viva;

    const updated = await prisma.criterionAssessment.upsert({
      where: {
        assessmentId_criterionId: {
          assessmentId,
          criterionId
        }
      },
      update: {
        assessorId: dto.assessorId,
        status: dto.status,
        practicalMarks: practical,
        theoryMarks: theory,
        vivaMarks: viva,
        totalAwardedMarks: totalAwarded,
        assessorNote: dto.assessorNote,
        evidenceOpened: dto.evidenceOpened ?? true
      },
      create: {
        assessmentId,
        criterionId,
        assessorId: dto.assessorId,
        status: dto.status,
        practicalMarks: practical,
        theoryMarks: theory,
        vivaMarks: viva,
        totalAwardedMarks: totalAwarded,
        assessorNote: dto.assessorNote,
        evidenceOpened: dto.evidenceOpened ?? true
      }
    });

    await prisma.auditEvent.create({
      data: {
        assessmentId,
        actorId: dto.assessorId,
        actorRole: 'ASSESSOR',
        eventType: 'CRITERION_EVALUATED',
        entityType: 'CriterionAssessment',
        entityId: updated.id,
        payloadJson: JSON.stringify({
          criterionCode: criterion.code,
          status: dto.status,
          practical,
          theory,
          viva,
          totalAwarded
        })
      }
    });

    return updated;
  }
}
