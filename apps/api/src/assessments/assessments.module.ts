import { Module } from '@nestjs/common';
import { AssessmentsService } from './assessments.service.js';
import { AssessmentsController } from './assessments.controller.js';

@Module({
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService]
})
export class AssessmentsModule {}
