import { Controller, Get } from '@nestjs/common';
import { prisma } from '@sih26242/database';

@Controller()
export class HealthController {
  @Get('health')
  async health() {
    return {
      status: 'UP',
      service: 'PS26242 RPL Assessment Platform API',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime()
    };
  }

  @Get('ready')
  async ready() {
    let dbStatus = 'UP';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e: any) {
      dbStatus = `DOWN: ${e.message}`;
    }

    return {
      status: dbStatus === 'UP' ? 'READY' : 'DEGRADED',
      database: dbStatus,
      timestamp: new Date().toISOString()
    };
  }
}
