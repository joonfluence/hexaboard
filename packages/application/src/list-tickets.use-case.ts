import { Inject, Injectable } from '@nestjs/common';
import type { Ticket } from '@todo/domain';
import type { TicketFilter, TicketRepository } from './ticket.repository';
import { TICKET_REPOSITORY } from './tokens';

/** 조건에 맞는 티켓을 상태 순서, 컬럼 안 순서로 돌려준다. */
export interface ListTickets {
  execute(filter?: TicketFilter): Promise<Ticket[]>;
}

@Injectable()
export class ListTicketsService implements ListTickets {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepository,
  ) {}

  execute(filter?: TicketFilter): Promise<Ticket[]> {
    return this.tickets.findAll(filter);
  }
}
