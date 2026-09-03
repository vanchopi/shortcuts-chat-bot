import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHello(): string {
    return 'Shortcuts Bot API';
  }

  @Get('health/database')
  async checkDatabase() {
    const consultations = await this.prisma.consultation.count();

    return {
      status: 'ok',
      database: 'connected',
      consultations,
    };
  }
}