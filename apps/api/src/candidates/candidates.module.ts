import { Module } from '@nestjs/common';
import { CandidatesService } from './candidates.service.js';
import { CandidatesController } from './candidates.controller.js';

@Module({
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService]
})
export class CandidatesModule {}
