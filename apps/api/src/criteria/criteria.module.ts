import { Module } from '@nestjs/common';
import { CriteriaController } from './criteria.controller.js';
import { CriteriaService } from './criteria.service.js';

@Module({
  controllers: [CriteriaController],
  providers: [CriteriaService],
  exports: [CriteriaService]
})
export class CriteriaModule {}
