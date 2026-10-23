import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TelegramResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
  };
  text?: string;
}

interface ColoringConsultation {
  id: string;
  referenceImages: string[];
  currentHairImages: string[];
  hairHistory: string | null;
}

@Injectable()
export class TelegramService {
  private readonly botToken: string;
  private readonly masterChatId: string;

  constructor(configService: ConfigService) {
    this.botToken =
      configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');

    this.masterChatId =
      configService.getOrThrow<string>(
        'TELEGRAM_MASTER_CHAT_ID',
      );
  }

  async sendConsultation(
    consultation: ColoringConsultation,
  ): Promise<TelegramMessage> {
    const referenceImages =
      consultation.referenceImages.join('\n') || 'Не указаны';

    const currentHairImages =
      consultation.currentHairImages.join('\n') || 'Не указаны';

    const text = [
      `Новая консультация #${consultation.id}`,
      '',
      'Референс:',
      referenceImages,
      '',
      'Волосы сейчас:',
      currentHairImages,
      '',
      'История окрашивания:',
      consultation.hairHistory ?? 'Не указана',
      '',
      'Ответьте на это сообщение, чтобы отправить ответ клиенту.',
    ].join('\n');

    return this.sendMessage(text);
  }

  async sendMessage(text: string): Promise<TelegramMessage> {
    const response = await fetch(
      `https://api.telegram.org/bot${this.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.masterChatId,
          text,
        }),
      },
    );

    const data =
      (await response.json()) as TelegramResponse<TelegramMessage>;

    if (!response.ok || !data.ok || !data.result) {
      throw new Error(
        data.description ?? 'Telegram request failed',
      );
    }

    return data.result;
  }
}