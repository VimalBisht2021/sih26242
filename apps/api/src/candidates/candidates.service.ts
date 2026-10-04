import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@sih26242/database';
import {
  EducationLevel,
  EnrolmentStatus,
  ApplicantContextSource
} from '@sih26242/contracts';

export interface CreateCandidateDto {
  fullName: string;
  primaryLanguage?: string;
  phone?: string;
  highestFormalEducation?: EducationLevel;
  currentEnrolment?: EnrolmentStatus;
  educationContextVerified?: boolean;
  applicantContextSource?: ApplicantContextSource;
  educationEvidenceRefs?: string[];
  consentVersion?: string;
}

export interface AddExperienceDto {
  rawText: string;
  audioRecordingUrl?: string;
  detectedLanguage?: string;
  normalizedSkills?: string[];
  declaredTasks?: string[];
  declaredTools?: string[];
  declaredOutputs?: string[];
  yearsExperience?: number;
  source?: string;
}

@Injectable()
export class CandidatesService {
  async createCandidate(dto: CreateCandidateDto) {
    return prisma.candidate.create({
      data: {
        fullName: dto.fullName,
        primaryLanguage: dto.primaryLanguage || 'hi',
        phone: dto.phone,
        highestFormalEducation: (dto.highestFormalEducation as any) || 'NONE',
        currentEnrolment: (dto.currentEnrolment as any) || 'NONE',
        educationContextVerified: dto.educationContextVerified || false,
        applicantContextSource: (dto.applicantContextSource as any) || 'SELF_DECLARED',
        educationEvidenceRefs: dto.educationEvidenceRefs || [],
        consentVersion: dto.consentVersion || 'dpdp-2026-v1'

      }
    });
  }

  async getCandidate(id: string) {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        experienceStatements: true,
        assessments: {
          include: {
            qualificationVersion: true
          }
        }
      }
    });
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found.`);
    }
    return candidate;
  }

  async addExperience(candidateId: string, dto: AddExperienceDto) {
    await this.getCandidate(candidateId);

    return prisma.experienceStatement.create({
      data: {
        candidateId,
        rawText: dto.rawText,
        audioRecordingUrl: dto.audioRecordingUrl,
        detectedLanguage: dto.detectedLanguage || 'hi',
        normalizedSkills: dto.normalizedSkills || [],
        declaredTasks: dto.declaredTasks || [],
        declaredTools: dto.declaredTools || [],
        declaredOutputs: dto.declaredOutputs || [],
        yearsExperience: dto.yearsExperience || 0,
        source: dto.source || 'VOICE'
      }
    });
  }

  async listCandidates() {
    return prisma.candidate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        experienceStatements: true
      }
    });
  }

  async updateCandidate(id: string, dto: Partial<CreateCandidateDto>) {
    await this.getCandidate(id);
    return prisma.candidate.update({
      where: { id },
      data: {
        ...(dto.fullName ? { fullName: dto.fullName } : {}),
        ...(dto.phone ? { phone: dto.phone } : {}),
        ...(dto.highestFormalEducation ? { highestFormalEducation: dto.highestFormalEducation as any } : {}),
        ...(dto.currentEnrolment ? { currentEnrolment: dto.currentEnrolment as any } : {}),
        ...(dto.primaryLanguage ? { primaryLanguage: dto.primaryLanguage } : {})
      }
    });
  }
}
