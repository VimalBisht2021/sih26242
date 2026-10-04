import {
  Controller,
  Post,
  Body,
  Param
} from '@nestjs/common';
import { EvidenceService, SubmitEvidenceDto } from './evidence.service.js';

@Controller('assessments')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post(':id/tasks/:taskId/evidence')
  async submitEvidence(
    @Param('id') assessmentId: string,
    @Param('taskId') taskId: string,
    @Body() dto: SubmitEvidenceDto
  ) {
    const result = await this.evidenceService.submitEvidence(assessmentId, taskId, dto);
    return result;
  }
}
