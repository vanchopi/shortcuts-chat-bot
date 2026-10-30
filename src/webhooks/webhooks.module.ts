import { Module } from '@nestjs/common';
import { ConsultationsModule } from '../consultations/consultations.module.js';
import { TelegramWebhookController } from './telegram-webhook/telegram-webhook.controller.js';
import { WebhooksService } from './webhooks.service.js';

@Module({
  imports: [ConsultationsModule],
  controllers: [TelegramWebhookController],
  providers: [WebhooksService],
})
export class WebhooksModule {}