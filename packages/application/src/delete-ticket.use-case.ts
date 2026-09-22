import { Inject, Injectable } from '@nestjs/common';
import { TicketNotFoundError } from './errors';
import type { TicketRepository } from './ticket.repository';
import { TICKET_REPOSITORY } from './tokens';

/** 공개 식별자로 티켓을 삭제한다. 없으면 TicketNotFoundError. */
export interface DeleteTicket {
  execute(ticketId: string): Promise<void>;
}

@Injectable()
export class DeleteTicketService implements DeleteTicket {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepository,
  ) {}

  async execute(ticketId: string): Promise<void> {
    if (!(await this.tickets.deleteByTicketId(ticketId))) {
      throw new TicketNotFoundError(ticketId);
    }
  }
}
