import {
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateIf,
} from 'class-validator';

export enum IncomingMessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
}

export class ProcessMessageDto {
  @IsEnum(IncomingMessageType)
  type!: IncomingMessageType;

  @ValidateIf((dto: ProcessMessageDto) => {
    return dto.type === IncomingMessageType.TEXT;
  })
  @IsString()
  @IsNotEmpty()
  text?: string;

  @ValidateIf((dto: ProcessMessageDto) => {
    return dto.type === IncomingMessageType.IMAGE;
  })
  @IsString()
  @IsNotEmpty()
  attachmentUrl?: string;
}