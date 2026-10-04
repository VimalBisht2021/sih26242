import { Module } from '@nestjs/common';
import { EvidenceService } from './evidence.service.js';
import { EvidenceController } from './evidence.controller.js';
import { EvidenceStorageService } from './evidence-storage.service.js';

@Module({
  controllers: [EvidenceController],
  providers: [EvidenceService, EvidenceStorageService],
  exports: [EvidenceService, EvidenceStorageService]
})
export class EvidenceModule {}
