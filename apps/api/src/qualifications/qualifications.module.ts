import { Module } from '@nestjs/common';
import { QualificationsService } from './qualifications.service.js';
import { QualificationsController } from './qualifications.controller.js';

@Module({
  controllers: [QualificationsController],
  providers: [QualificationsService],
  exports: [QualificationsService]
})
export class QualificationsModule {}
