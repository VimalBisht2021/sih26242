import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { SyncService, SyncBatchDto } from './sync.service.js';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('batch')
  async batchSync(@Body() dto: SyncBatchDto) {
    const result = await this.syncService.processBatch(dto);
    return result;
  }

  @Get('changes')
  async getChanges(@Query('cursor') cursor?: string) {
    const result = await this.syncService.getChanges(cursor ? parseInt(cursor, 10) : undefined);
    return result;
  }
}
