import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  async claimTelegramUpdate(
    updateId: number,
  ): Promise<boolean> {
    try {
      await this.prisma.telegramWebhookUpdate.create({
        data: {
          updateId,
        },
      });

      return true;
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        return false;
      }

      throw error;
    }
  }

  markTelegramUpdateProcessed(updateId: number) {
    return this.prisma.telegramWebhookUpdate.update({
      where: {
        updateId,
      },
      data: {
        processedAt: new Date(),
      },
    });
  }

  releaseTelegramUpdate(updateId: number) {
    return this.prisma.telegramWebhookUpdate.deleteMany({
      where: {
        updateId,
      },
    });
  }

  private isUniqueConstraintError(
    error: unknown,
  ): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}