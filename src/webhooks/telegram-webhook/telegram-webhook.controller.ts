import { Body, Controller, Post } from '@nestjs/common';
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
  constructor(
    private readonly consultationsService: ConsultationsService,
  ) {}

  @Post()
  async handleUpdate(@Body() update: TelegramUpdate) {
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