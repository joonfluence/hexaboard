import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  CreateTicket,
  DeleteTicket,
  GetTicket,
  ListTickets,
  MoveTicket,
  SortColumn,
  UpdateTicket,
} from '@todo/application';
import type { TicketStatus } from '@todo/domain';
import { JsonContentTypeGuard } from '../common/json-content-type.guard';
import { RejectFieldsPipe } from '../common/reject-fields.pipe';
import {
  createBodyValidationPipe,
  createQueryValidationPipe,
} from '../common/validation';
import { ValidationFailedException } from '../common/http-errors';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SortColumnDto } from './dto/sort-column.dto';
import { ListTicketsQuery } from './dto/list-tickets.query';
import { MovePositionDto } from './dto/move-position.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
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

const REJECTED_FIELDS: Record<string, string> = Object.fromEntries(
  SERVER_SET_FIELDS.map((field) => [
    field,
    `${field}은(는) 서버가 정하는 값이라 보낼 수 없습니다.`,
  ]),
);

@Controller('tickets')
export class TicketsController {
  constructor(
    @Inject(CreateTicket) private readonly createTicket: CreateTicket,
    @Inject(GetTicket) private readonly getTicket: GetTicket,
    @Inject(ListTickets) private readonly listTickets: ListTickets,
    @Inject(DeleteTicket) private readonly deleteTicket: DeleteTicket,
    @Inject(UpdateTicket) private readonly updateTicket: UpdateTicket,
    @Inject(MoveTicket) private readonly moveTicket: MoveTicket,
    @Inject(SortColumn) private readonly sortColumn: SortColumn,
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
      tags: dto.tags,
    });
    return toTicketResponse(ticket);
  }

  @Post('sort')
  @HttpCode(204)
  @UseGuards(JsonContentTypeGuard)
  @ApiNoContentResponse()
  async sort(
    @Body(new RejectFieldsPipe({}), createBodyValidationPipe())
    dto: SortColumnDto,
  ): Promise<void> {
    await this.sortColumn.execute(dto);
  }

  @Get()
  @ApiOkResponse({ type: TicketResponse, isArray: true })
  async list(
    @Query(createQueryValidationPipe()) query: ListTicketsQuery,
  ): Promise<TicketResponse[]> {
    const tickets = await this.listTickets.execute({
      q: query.q,
      statuses: query.status as TicketStatus[] | undefined,
      priorities: query.priority,
      tags: query.tag,
    });
    return tickets.map(toTicketResponse);
  }

  @Get(':ticketId')
  @ApiOkResponse({ type: TicketResponse })
  async get(
    @Param('ticketId', ParseTicketIdPipe) ticketId: string,
  ): Promise<TicketResponse> {
    return toTicketResponse(await this.getTicket.execute(ticketId));
  }

  @Patch(':ticketId')
  @UseGuards(JsonContentTypeGuard)
  @ApiOkResponse({ type: TicketResponse })
  async update(
    @Param('ticketId', ParseTicketIdPipe) ticketId: string,
    @Body(new RejectFieldsPipe(REJECTED_FIELDS), createBodyValidationPipe())
    dto: UpdateTicketDto,
  ): Promise<TicketResponse> {
    const { title, description, priority, dueAt, tags } = dto;
    if (
      title === undefined &&
      description === undefined &&
      priority === undefined &&
      dueAt === undefined &&
      tags === undefined
    ) {
      throw new ValidationFailedException([
        { field: 'body', reason: '수정할 필드가 하나도 없습니다.' },
      ]);
    }
    const ticket = await this.updateTicket.execute(ticketId, {
      title,
      description,
      priority,
      dueAt: dueAt === undefined || dueAt === null ? dueAt : new Date(dueAt),
      tags,
    });
    return toTicketResponse(ticket);
  }

  @Put(':ticketId/position')
  @UseGuards(JsonContentTypeGuard)
  @ApiOkResponse({ type: TicketResponse })
  async move(
    @Param('ticketId', ParseTicketIdPipe) ticketId: string,
    @Body(new RejectFieldsPipe({}), createBodyValidationPipe())
    dto: MovePositionDto,
  ): Promise<TicketResponse> {
    const ticket = await this.moveTicket.execute({
      ticketId,
      status: dto.status,
      anchorTicketId: dto.anchorTicketId,
      placement: dto.placement,
    });
    return toTicketResponse(ticket);
  }

  @Delete(':ticketId')
  @HttpCode(204)
  @ApiNoContentResponse()
  async remove(
    @Param('ticketId', ParseTicketIdPipe) ticketId: string,
  ): Promise<void> {
    await this.deleteTicket.execute(ticketId);
  }
}
