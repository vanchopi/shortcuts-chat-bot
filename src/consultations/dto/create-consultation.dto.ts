import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateConsultationDto {
  @IsString()
  @IsNotEmpty()
  externalUserId!: string;

  @IsString()
  @IsNotEmpty()
  externalConversationId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;
}