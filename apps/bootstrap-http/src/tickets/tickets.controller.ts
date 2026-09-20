import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiCreatedResponse } from '@nestjs/swagger';
import { CreateTicket } from '@todo/application';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketResponse, toTicketResponse } from './dto/ticket-response.dto';

@Controller('tickets')
export class TicketsController {
  constructor(
    @Inject(CreateTicket) private readonly createTicket: CreateTicket,
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
}
