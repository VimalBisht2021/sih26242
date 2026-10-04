import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@sih26242/database';

export interface WorkerAssessmentImportRecord {
  candidate_id: string;
  full_name?: string;
  occupation: string;
  language: string;
  years_experience: number;
  experience_text: string;
  declared_tasks?: string[];
  declared_tools?: string[];
  declared_outputs?: string[];
  prior_evidence_refs?: string[];
  highest_education?: string;
  qualification_label?: string;
  assessor_id?: string;
  site_id?: string;
}

export interface WorkerAssessmentImportBatchDto {
  records: WorkerAssessmentImportRecord[];
  sourceName?: string;
}

@Injectable()
export class ImportsService {
  // In-memory reports store for imports
  private reports = new Map<string, any>();

  async importWorkerAssessments(dto: WorkerAssessmentImportBatchDto) {
    if (!dto.records || !Array.isArray(dto.records) || dto.records.length === 0) {
      throw new BadRequestException('At least one record is required for import.');
    }

    const importId = `IMP-${Date.now().toString(36).toUpperCase()}`;
    const importedCandidates: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < dto.records.length; i++) {
      const rec = dto.records[i];
      try {
        if (!rec.candidate_id || !rec.experience_text) {
          throw new Error(`Record at index ${i} missing candidate_id or experience_text.`);
        }

        // 1. Candidate upsert
        const candidate = await prisma.candidate.upsert({
          where: { id: rec.candidate_id },
          update: {
            fullName: rec.full_name || `Worker ${rec.candidate_id}`,
            primaryLanguage: rec.language || 'hi',
            highestFormalEducation: (rec.highest_education as any) || 'NONE'
          },
          create: {
            id: rec.candidate_id,
            fullName: rec.full_name || `Worker ${rec.candidate_id}`,
            primaryLanguage: rec.language || 'hi',
            highestFormalEducation: (rec.highest_education as any) || 'NONE',
            consentVersion: 'dpdp-2026-v1'
          }
        });

        // 2. Experience statement create
        const exp = await prisma.experienceStatement.create({
          data: {
            candidateId: candidate.id,
            rawText: rec.experience_text,
            detectedLanguage: rec.language || 'hi',
            normalizedSkills: rec.declared_tasks || [],
            declaredTasks: rec.declared_tasks || [],
            declaredTools: rec.declared_tools || [],
            declaredOutputs: rec.declared_outputs || [],
            yearsExperience: rec.years_experience || 1,
            source: 'ORGANIZER_IMPORT'
          }
        });

        importedCandidates.push({
          candidateId: candidate.id,
          statementId: exp.id,
          status: 'SUCCESS'
        });
      } catch (err: any) {
        errors.push({
          index: i,
          candidateId: rec.candidate_id,
          error: err.message
        });
      }
    }

    const report = {
      importId,
      sourceName: dto.sourceName || 'organizer_upload',
      totalSubmitted: dto.records.length,
      successCount: importedCandidates.length,
      errorCount: errors.length,
      importedCandidates,
      errors,
      importedAt: new Date().toISOString()
    };

    this.reports.set(importId, report);

    return {
      success: true,
      importId,
      totalSubmitted: dto.records.length,
      successCount: importedCandidates.length,
      errorCount: errors.length,
      reportUrl: `/api/imports/${importId}/report`
    };
  }

  async getImportReport(id: string) {
    const report = this.reports.get(id);
    if (!report) {
      throw new NotFoundException(`Import report ${id} not found.`);
    }
    return { success: true, report };
  }
}
