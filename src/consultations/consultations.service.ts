import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ConsultationStatus,
  ConsultationStep,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  IncomingMessageType,
  ProcessMessageDto,
} from './dto/process-message.dto.js';
import { MessagesService } from '../messages/messages.service.js';

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesService: MessagesService,
  ) { }

  create() {
    return this.prisma.consultation.create({
      data: {},
    });
  }

  async findOne(id: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }

    return consultation;
  }

  async findMessages(id: string) {
    await this.findOne(id);

    return this.messagesService.findByConsultation(id);
  }

  async processMessage(id: string, message: ProcessMessageDto) {
    const consultation = await this.findOne(id);

    await this.messagesService.createClientMessage(id, message);

    switch (consultation.currentStep) {
      case ConsultationStep.WAITING_REFERENCE:
        if (
          message.type !== IncomingMessageType.IMAGE ||
          !message.attachmentUrl
        ) {
          return this.createResponse(
            consultation,
            'Пожалуйста, пришлите фотографию желаемого окрашивания.',
          );
        }

        return this.saveReferenceImage(id, message.attachmentUrl);

      case ConsultationStep.WAITING_CURRENT_PHOTO:
        if (
          message.type !== IncomingMessageType.IMAGE ||
          !message.attachmentUrl
        ) {
          return this.createResponse(
            consultation,
            'Теперь нужна фотография ваших волос сейчас.',
          );
        }

        return this.saveCurrentHairImage(id, message.attachmentUrl);

      case ConsultationStep.WAITING_HAIR_HISTORY:
        if (message.type !== IncomingMessageType.TEXT || !message.text) {
          return this.createResponse(
            consultation,
            'Расскажите, пожалуйста, натуральные ли у вас волосы. Если они окрашены — когда и чем вы красились?',
          );
        }

        return this.saveHairHistory(id, message.text);

      case ConsultationStep.WAITING_FOR_MASTER:
        return this.createResponse(
          consultation,
          'Все данные уже собраны и переданы мастеру. Мы сообщим вам предварительную стоимость после его ответа.',
        );

      case ConsultationStep.COMPLETED:
        return this.createResponse(
          consultation,
          'Консультация уже завершена.',
        );
    }
  }

  private async saveReferenceImage(id: string, attachmentUrl: string) {
    const consultation = await this.prisma.consultation.update({
      where: { id },
      data: {
        referenceImages: {
          push: attachmentUrl,
        },
        currentStep: ConsultationStep.WAITING_CURRENT_PHOTO,
      },
    });

    return this.createResponse(
      consultation,
      'Отлично! Теперь пришлите фотографию ваших волос сейчас.',
    );
  }

  private async saveCurrentHairImage(id: string, attachmentUrl: string) {
    const consultation = await this.prisma.consultation.update({
      where: { id },
      data: {
        currentHairImages: {
          push: attachmentUrl,
        },
        currentStep: ConsultationStep.WAITING_HAIR_HISTORY,
      },
    });

    return this.createResponse(
      consultation,
      'Расскажите, пожалуйста, натуральные ли у вас волосы. Если они окрашены — когда и чем вы красились?',
    );
  }

  private async saveHairHistory(id: string, hairHistory: string) {
    const consultation = await this.prisma.consultation.update({
      where: { id },
      data: {
        hairHistory,
        status: ConsultationStatus.WAITING_FOR_MASTER,
        currentStep: ConsultationStep.WAITING_FOR_MASTER,
      },
    });

    return this.createResponse(
      consultation,
      'Спасибо! Все данные собраны и переданы мастеру для оценки.',
    );
  }

  private async createResponse(
    consultation: {
      id: string;
      status: ConsultationStatus;
      currentStep: ConsultationStep;
    },
    reply: string,
  ) {

    await this.messagesService.createBotMessage(
      consultation.id,
      reply,
    );

    return {
      consultationId: consultation.id,
      status: consultation.status,
      currentStep: consultation.currentStep,
      reply,
    };
  }
}