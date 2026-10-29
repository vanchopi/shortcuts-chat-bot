import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsultationsService } from '../../consultations/consultations.service.js';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat: {
      id: number;
    };
    reply_to_message?: {
      message_id: number;
    };
  };
}

@Controller('webhooks/telegram')
export class TelegramWebhookController {
  private readonly webhookSecret: string;

  constructor(
    private readonly consultationsService: ConsultationsService,
    configService: ConfigService,
  ) {
    this.webhookSecret =
      configService.getOrThrow<string>(
        'TELEGRAM_WEBHOOK_SECRET',
      );
  }

  @Post()
  async handleUpdate(
    @Headers('x-telegram-bot-api-secret-token')
    webhookSecret: string | undefined,
    @Body() update: TelegramUpdate,
  ) {
    if (webhookSecret !== this.webhookSecret) {
      throw new UnauthorizedException(
        'Invalid Telegram webhook secret',
      );
    }

    const message = update.message;
    const replyToMessageId =
      message?.reply_to_message?.message_id;
    const text = message?.text;

    if (!message || !replyToMessageId || !text) {
      return {
        status: 'ignored',
      };
    }

    await this.consultationsService.processTelegramReply(
      String(message.chat.id),
      replyToMessageId,
      text,
    );

    return {
      status: 'processed',
    };
  }
}