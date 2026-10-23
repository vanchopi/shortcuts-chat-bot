import { MasterResponseDto } from './dto/master-response.dto.js';
import { CreateConsultationDto } from './dto/create-consultation.dto.js';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProcessMessageDto } from './dto/process-message.dto.js';
import { ConsultationsService } from './consultations.service.js';

@Controller('consultations')
export class ConsultationsController {
  constructor(
    private readonly consultationsService: ConsultationsService,
  ) { }

  @Post()
  create(@Body() dto: CreateConsultationDto) {
    return this.consultationsService.create(dto);
  }

  @Post(':id/messages')
  processMessage(
    @Param('id') id: string,
    @Body() message: ProcessMessageDto,
  ) {
    return this.consultationsService.processMessage(id, message);
  }

  @Get(':id/messages')
  findMessages(@Param('id') id: string) {
    return this.consultationsService.findMessages(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consultationsService.findOne(id);
  }

  @Post(':id/master-response')
  processMasterResponse(
    @Param('id') id: string,
    @Body() dto: MasterResponseDto,
  ) {
    return this.consultationsService.processMasterResponse(
      id,
      dto,
    );
  }
}