import { Module } from '@nestjs/common';
import { MessagesModule } from '../messages/messages.module.js';
import { TelegramModule } from '../telegram/telegram.module.js';
import { ConsultationsController } from './consultations.controller.js';
import { ConsultationsService } from './consultations.service.js';

@Module({
  imports: [
    MessagesModule,
    TelegramModule
  ],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}