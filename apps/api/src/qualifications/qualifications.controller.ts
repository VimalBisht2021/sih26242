import { Controller, Get, Param } from '@nestjs/common';
import { QualificationsService } from './qualifications.service.js';

@Controller('qualifications')
export class QualificationsController {
  constructor(private readonly qualificationsService: QualificationsService) {}

  @Get()
  async listQualifications() {
    const list = await this.qualificationsService.listQualifications();
    return { success: true, count: list.length, qualifications: list };
  }

  @Get(':id')
  async getQualification(@Param('id') id: string) {
    const qualification = await this.qualificationsService.getQualification(id);
    return { success: true, qualification };
  }

  @Get(':id/tasks')
  async getTasks(@Param('id') id: string) {
    const tasks = await this.qualificationsService.getTasks(id);
    return { success: true, tasks };
  }
}
