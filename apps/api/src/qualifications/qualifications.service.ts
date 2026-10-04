import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@sih26242/database';
import { QualificationRepository } from '@sih26242/qualification';

@Injectable()
export class QualificationsService {
  async listQualifications() {
    const fromDb = await prisma.qualificationVersion.findMany({
      include: {
        nos: true
      }
    });

    if (fromDb.length > 0) {
      return fromDb;
    }

    // Fallback to in-memory repository if DB is not yet seeded
    return QualificationRepository.getPool();
  }

  async getQualification(idOrCode: string) {
    const q = await prisma.qualificationVersion.findFirst({
      where: {
        OR: [{ id: idOrCode }, { externalCode: idOrCode }]
      },
      include: {
        nos: {
          include: {
            criteria: true
          }
        },
        assessmentSchemes: true
      }
    });

    if (q) return q;

    const fromRepo = QualificationRepository.getPackage(idOrCode);
    if (!fromRepo) {
      throw new NotFoundException(`Qualification ${idOrCode} not found.`);
    }

    return {
      ...fromRepo.qualification,
      nos: fromRepo.nos.map(n => ({
        ...n,
        criteria: fromRepo.criteria.filter(c => c.nosId === n.id)
      })),
      assessmentSchemes: [fromRepo.scheme]
    };
  }

  async getTasks(idOrCode: string) {
    const pkg = QualificationRepository.getPackage(idOrCode);
    if (!pkg) {
      // Default to Sewing Machine Operator tasks
      return QualificationRepository.getPackage('AMH/Q0301')?.tasks || [];
    }
    return pkg.tasks;
  }
}
