import { Controller, Post, Param } from '@nestjs/common';
import { MappingService } from './mapping.service.js';

@Controller('candidates')
export class MappingController {
  constructor(private readonly mappingService: MappingService) {}

  @Post(':id/mapping')
  async mapCandidate(@Param('id') id: string) {
    const result = await this.mappingService.mapCandidateExperience(id);
    return { success: true, mapping: result };
  }
}
