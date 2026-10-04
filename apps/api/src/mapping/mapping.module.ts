import { Module } from '@nestjs/common';
import { MappingService } from './mapping.service.js';
import { MappingController } from './mapping.controller.js';

@Module({
  controllers: [MappingController],
  providers: [MappingService],
  exports: [MappingService]
})
export class MappingModule {}
