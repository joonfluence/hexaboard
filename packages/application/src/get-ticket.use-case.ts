import { Inject, Injectable } from '@nestjs/common';
import type { Ticket } from '@todo/domain';
import { TicketNotFoundError } from './errors';
import type { TicketRepository } from './ticket.repository';
import { TICKET_REPOSITORY } from './tokens';

/** 공개 식별자로 티켓 한 건을 조회한다. 없으면 TicketNotFoundError. */
export interface GetTicket {
  execute(ticketId: string): Promise<Ticket>;
}

@Injectable()
export class GetTicketService implements GetTicket {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepository,
  ) {}

  async execute(ticketId: string): Promise<Ticket> {
    const ticket = await this.tickets.findByTicketId(ticketId);
    if (!ticket) {
      throw new TicketNotFoundError(ticketId);
    }
    return ticket;
  }
}
