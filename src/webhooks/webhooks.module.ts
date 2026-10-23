import { Module } from '@nestjs/common';
import { ConsultationsModule } from '../consultations/consultations.module.js';
import { TelegramWebhookController } from './telegram-webhook/telegram-webhook.controller.js';

@Module({
  imports: [ConsultationsModule],
  controllers: [TelegramWebhookController],
})
export class WebhooksModule {}