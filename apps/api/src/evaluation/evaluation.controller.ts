import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { EvaluationService, CreateEvaluationRunDto } from './evaluation.service.js';

@Controller('evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post('runs')
  async createRun(@Body() dto: CreateEvaluationRunDto) {
    const result = await this.evaluationService.createEvaluationRun(dto);
    return result;
  }

  @Get('runs/:id')
  async getRun(@Param('id') id: string) {
    const result = await this.evaluationService.getEvaluationRun(id);
    return result;
  }

  @Get('runs/:id/metrics')
  async getMetrics(@Param('id') id: string) {
    const result = await this.evaluationService.getMetrics(id);
    return result;
  }
}
