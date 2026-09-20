import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { CreateTicket, GetTicket } from '@todo/application';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketResponse, toTicketResponse } from './dto/ticket-response.dto';
import { ParseTicketIdPipe } from './parse-ticket-id.pipe';

@Controller('tickets')
export class TicketsController {
  constructor(
    @Inject(CreateTicket) private readonly createTicket: CreateTicket,
    @Inject(GetTicket) private readonly getTicket: GetTicket,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: TicketResponse })
  async create(@Body() dto: CreateTicketDto): Promise<TicketResponse> {
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
