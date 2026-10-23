
import { Injectable } from '@nestjs/common';
import {
  MessageSender,
  MessageType,
} from '../generated/prisma/client.js';
import {
  IncomingMessageType,
  ProcessMessageDto,
} from '../consultations/dto/process-message.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

type MessageDatabase = Pick<PrismaService, 'message'>;

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) { }

  createClientMessage(
    consultationId: string,
    message: ProcessMessageDto,
    database: MessageDatabase = this.prisma,
  ) {
    return database.message.create({
      data: {
        consultationId,
        sender: MessageSender.CLIENT,
        type:
          message.type === IncomingMessageType.TEXT
            ? MessageType.TEXT
            : MessageType.IMAGE,
        text: message.text,
        attachmentUrl: message.attachmentUrl,
      },
    });
  }

  createBotMessage(
    consultationId: string,
    text: string,
    database: MessageDatabase = this.prisma,
  ) {
    return database.message.create({
      data: {
        consultationId,
        sender: MessageSender.BOT,
        type: MessageType.TEXT,
        text,
      },
    });
  }

  createMasterMessage(
    consultationId: string,
    text: string,
    database: MessageDatabase = this.prisma,
  ) {
    return database.message.create({
      data: {
        consultationId,
        sender: MessageSender.MASTER,
        type: MessageType.TEXT,
        text,
      },
    });
  }

  findByConsultation(consultationId: string) {
    return this.prisma.message.findMany({
      where: {
        consultationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }  
}