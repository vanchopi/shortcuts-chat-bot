import { Body, Controller, Post } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { TelegramService } from './telegram.service.js';

class SendTelegramMessageDto {
  @IsString()
  @IsNotEmpty()
  text!: string;
}

@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
  ) {}

  @Post('test')
  async sendTestMessage(
    @Body() dto: SendTelegramMessageDto,
  ) {
    const message = await this.telegramService.sendMessage(
      dto.text,
    );

    return {
      status: 'sent',
      telegramMessageId: message.message_id,
      chatId: message.chat.id,
    };
  }
}