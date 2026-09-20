import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { CreateTicket, GetTicket } from '@todo/application';
import { JsonContentTypeGuard } from '../common/json-content-type.guard';
import { RejectFieldsPipe } from '../common/reject-fields.pipe';
import { createBodyValidationPipe } from '../common/validation';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketResponse, toTicketResponse } from './dto/ticket-response.dto';
import { ParseTicketIdPipe } from './parse-ticket-id.pipe';

/** 서버가 정하는 값은 요청으로 받지 않는다. 무시하지 않고 거부한다(D-51). */
const SERVER_SET_FIELDS = [
  'ticketId',
  'status',
  'position',
  'createdAt',
  'updatedAt',
];

/** 범위 밖 필드. 이 기능에서 태그는 지원하지 않는다(태그 기능에서 폐기할 임시 규칙). */
const REJECTED_FIELDS: Record<string, string> = {
  ...Object.fromEntries(
    SERVER_SET_FIELDS.map((field) => [
      field,
      `${field}은(는) 서버가 정하는 값이라 보낼 수 없습니다.`,
    ]),
  ),
  tags: '태그는 아직 지원하지 않습니다.',
};

@Controller('tickets')
export class TicketsController {
  constructor(
    @Inject(CreateTicket) private readonly createTicket: CreateTicket,
    @Inject(GetTicket) private readonly getTicket: GetTicket,
  ) {}

  @Post()
  @UseGuards(JsonContentTypeGuard)
  @ApiCreatedResponse({ type: TicketResponse })
  async create(
    @Body(new RejectFieldsPipe(REJECTED_FIELDS), createBodyValidationPipe())
    dto: CreateTicketDto,
  ): Promise<TicketResponse> {
    const ticket = await this.createTicket.execute({
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
    });
    return toTicketResponse(ticket);
  }

  @Get(':ticketId')
  @ApiOkResponse({ type: TicketResponse })
  async get(
    @Param('ticketId', ParseTicketIdPipe) ticketId: string,
  ): Promise<TicketResponse> {
    return toTicketResponse(await this.getTicket.execute(ticketId));
  }
}
