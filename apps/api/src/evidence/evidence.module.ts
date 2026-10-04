import { Module } from '@nestjs/common';
import { EvidenceService } from './evidence.service.js';
import { EvidenceController } from './evidence.controller.js';

@Module({
  controllers: [EvidenceController],
  providers: [EvidenceService],
  exports: [EvidenceService]
})
export class EvidenceModule {}
