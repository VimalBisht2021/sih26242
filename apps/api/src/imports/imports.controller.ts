import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ImportsService, WorkerAssessmentImportBatchDto } from './imports.service.js';

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('worker-assessments')
  async importWorkerAssessments(@Body() dto: WorkerAssessmentImportBatchDto) {
    const result = await this.importsService.importWorkerAssessments(dto);
    return result;
  }

  @Get(':id/report')
  async getReport(@Param('id') id: string) {
    const result = await this.importsService.getImportReport(id);
    return result;
  }
}
