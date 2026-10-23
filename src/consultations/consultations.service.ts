import { CreateConsultationDto } from './dto/create-consultation.dto.js';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ConsultationStatus,
  ConsultationStep,
  Prisma
} from '../generated/prisma/client.js';
import { MasterResponseDto } from './dto/master-response.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  IncomingMessageType,
  ProcessMessageDto,
} from './dto/process-message.dto.js';
import { MessagesService } from '../messages/messages.service.js';
import { TelegramService } from '../telegram/telegram.service.js';

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesService: MessagesService,
    private readonly telegramService: TelegramService,

  ) { }

  create(dto: CreateConsultationDto) {
    return this.prisma.$transaction(async (transaction) => {
      const customer = await transaction.customer.upsert({
        where: {
          externalUserId: dto.externalUserId,
        },
        update: dto.username
          ? {
            username: dto.username,
          }
          : {},
        create: {
          externalUserId: dto.externalUserId,
          username: dto.username,
        },
      });

      const conversation = await transaction.conversation.upsert({
        where: {
          externalConversationId: dto.externalConversationId,
        },
        update: {
          customerId: customer.id,
        },
        create: {
          externalConversationId: dto.externalConversationId,
          customerId: customer.id,
        },
      });

      return transaction.consultation.create({
        data: {
          conversationId: conversation.id,
        },
        include: {
          conversation: {
            include: {
              customer: true,
            },
          },
        },
      });
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

  async processMessage(
    id: string,
    message: ProcessMessageDto,
  ) {
    const result = await this.prisma.$transaction(
      async (transaction) => {
        const consultation =
          await transaction.consultation.findUnique({
            where: { id },
          });

        if (!consultation) {
          throw new NotFoundException(
            `Consultation ${id} not found`,
          );
        }

        await this.messagesService.createClientMessage(
          id,
          message,
          transaction,
        );

        switch (consultation.currentStep) {
          case ConsultationStep.WAITING_REFERENCE:
            if (
              message.type !== IncomingMessageType.IMAGE ||
              !message.attachmentUrl
            ) {
              return this.createResponse(
                transaction,
                consultation,
                'Пожалуйста, пришлите фотографию желаемого окрашивания.',
              );
            }

            return this.saveReferenceImage(
              transaction,
              id,
              message.attachmentUrl,
            );

          case ConsultationStep.WAITING_CURRENT_PHOTO:
            if (
              message.type !== IncomingMessageType.IMAGE ||
              !message.attachmentUrl
            ) {
              return this.createResponse(
                transaction,
                consultation,
                'Теперь нужна фотография ваших волос сейчас.',
              );
            }

            return this.saveCurrentHairImage(
              transaction,
              id,
              message.attachmentUrl,
            );

          case ConsultationStep.WAITING_HAIR_HISTORY:
            if (
              message.type !== IncomingMessageType.TEXT ||
              !message.text
            ) {
              return this.createResponse(
                transaction,
                consultation,
                'Расскажите, пожалуйста, натуральные ли у вас волосы. Если они окрашены — когда и чем вы красились?',
              );
            }

            return this.saveHairHistory(
              transaction,
              id,
              message.text,
            );

          case ConsultationStep.WAITING_FOR_MASTER:
            return this.createResponse(
              transaction,
              consultation,
              'Все данные уже собраны и переданы мастеру. Мы сообщим вам предварительную стоимость после его ответа.',
            );

          case ConsultationStep.COMPLETED:
            return this.createResponse(
              transaction,
              consultation,
              'Консультация уже завершена.',
            );
        }
      },
    );

    const { notifyMaster, ...response } = result;

    if (notifyMaster) {
      const consultation =
        await this.prisma.consultation.findUniqueOrThrow({
          where: { id },
        });

      const telegramMessage =
        await this.telegramService.sendConsultation(
          consultation,
        );

      await this.prisma.consultation.update({
        where: { id },
        data: {
          telegramChatId: String(telegramMessage.chat.id),
          telegramMessageId: telegramMessage.message_id,
        },
      });
    }

    return response;
  }

  private async saveReferenceImage(
    transaction: Prisma.TransactionClient,
    id: string,
    attachmentUrl: string,
  ) {
    const consultation = await transaction.consultation.update({
      where: { id },
      data: {
        referenceImages: {
          push: attachmentUrl,
        },
        currentStep: ConsultationStep.WAITING_CURRENT_PHOTO,
      },
    });

    return this.createResponse(
      transaction,
      consultation,
      'Отлично! Теперь пришлите фотографию ваших волос сейчас.',
    );
  }

  private async saveCurrentHairImage(
    transaction: Prisma.TransactionClient,
    id: string,
    attachmentUrl: string,
  ) {
    const consultation = await transaction.consultation.update({
      where: { id },
      data: {
        currentHairImages: {
          push: attachmentUrl,
        },
        currentStep: ConsultationStep.WAITING_HAIR_HISTORY,
      },
    });

    return this.createResponse(
      transaction,
      consultation,
      'Расскажите, пожалуйста, натуральные ли у вас волосы. Если они окрашены — когда и чем вы красились?',
    );
  }

  private async saveHairHistory(
    transaction: Prisma.TransactionClient,
    id: string,
    hairHistory: string,
  ) {
    const consultation = await transaction.consultation.update({
      where: { id },
      data: {
        hairHistory,
        status: ConsultationStatus.WAITING_FOR_MASTER,
        currentStep: ConsultationStep.WAITING_FOR_MASTER,
      },
    });

    return this.createResponse(
      transaction,
      consultation,
      'Спасибо! Все данные собраны и переданы мастеру для оценки.',
      true,
    );
  }

  async processMasterResponse(
    id: string,
    dto: MasterResponseDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const consultation = await transaction.consultation.findUnique({
        where: { id },
      });

      if (!consultation) {
        throw new NotFoundException(
          `Consultation ${id} not found`,
        );
      }

      if (
        consultation.status !==
        ConsultationStatus.WAITING_FOR_MASTER
      ) {
        throw new ConflictException(
          'Consultation is not waiting for a master response',
        );
      }

      await this.messagesService.createMasterMessage(
        id,
        dto.text,
        transaction,
      );

      const updatedConsultation =
        await transaction.consultation.update({
          where: { id },
          data: {
            masterResponse: dto.text,
            status: ConsultationStatus.ANSWERED,
            currentStep: ConsultationStep.COMPLETED,
          },
        });

      const clientReply =
        `Мастер посмотрел ваши фотографии. ${dto.text}`;

      await this.messagesService.createBotMessage(
        id,
        clientReply,
        transaction,
      );

      return {
        consultationId: updatedConsultation.id,
        status: updatedConsultation.status,
        currentStep: updatedConsultation.currentStep,
        reply: clientReply,
      };
    });
  }

  async processTelegramReply(
    telegramChatId: string,
    telegramMessageId: number,
    text: string,
  ) {
    const consultation =
      await this.prisma.consultation.findFirst({
        where: {
          telegramChatId,
          telegramMessageId,
        },
      });

    if (!consultation) {
      throw new NotFoundException(
        'Consultation for Telegram message not found',
      );
    }

    return this.processMasterResponse(
      consultation.id,
      { text },
    );
  }

  private async createResponse(
    transaction: Prisma.TransactionClient,
    consultation: {
      id: string;
      status: ConsultationStatus;
      currentStep: ConsultationStep;
    },
    reply: string,
    notifyMaster = false,
  ) {
    await this.messagesService.createBotMessage(
      consultation.id,
      reply,
      transaction,
    );

    return {
      consultationId: consultation.id,
      status: consultation.status,
      currentStep: consultation.currentStep,
      reply,
      notifyMaster,
    };
  }
}