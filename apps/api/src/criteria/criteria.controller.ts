import {
  Controller,
  Patch,
  Body,
  Param
} from '@nestjs/common';
import { CriteriaService, UpdateCriterionAssessmentDto } from './criteria.service.js';

@Controller('assessments')
export class CriteriaController {
  constructor(private readonly criteriaService: CriteriaService) {}

  @Patch(':id/criteria/:criterionId')
  async updateCriterion(
    @Param('id') assessmentId: string,
    @Param('criterionId') criterionId: string,
    @Body() dto: UpdateCriterionAssessmentDto
  ) {
    const updated = await this.criteriaService.updateCriterionAssessment(
      assessmentId,
      criterionId,
      dto
    );
    return { success: true, criterionAssessment: updated };
  }
}
