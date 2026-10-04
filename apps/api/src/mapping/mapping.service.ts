import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@sih26242/database';
import { MockAIProvider } from '@sih26242/ai';

@Injectable()
export class MappingService {
  private aiProvider = new MockAIProvider();

  async mapCandidateExperience(candidateId: string) {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { experienceStatements: true }
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate ${candidateId} not found.`);
    }

    const aggregatedExperience = candidate.experienceStatements
      .map(s => s.rawText)
      .join(' ') || 'General stitching and machine operation experience';

    const mappingResponse = await this.aiProvider.mapExperience(
      aggregatedExperience,
      candidate.primaryLanguage
    );

    return {
      candidateId,
      originalLanguage: candidate.primaryLanguage,
      rawExperienceSummary: aggregatedExperience,
      normalizedSkills: mappingResponse.normalizedSkills,
      topCandidates: mappingResponse.topCandidates,
      governance: mappingResponse.governance
    };
  }
}
