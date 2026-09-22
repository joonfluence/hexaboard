import { Inject, Injectable } from '@nestjs/common';
import type { Ticket, TicketChanges } from '@todo/domain';
import { TicketNotFoundError } from './errors';
import type { TicketRepository } from './ticket.repository';
import { TICKET_REPOSITORY } from './tokens';

/** 티켓의 제목·설명·우선순위·마감일을 부분 수정한다. 없으면 TicketNotFoundError. */
export interface UpdateTicket {
  execute(ticketId: string, changes: TicketChanges): Promise<Ticket>;
}

@Injectable()
export class UpdateTicketService implements UpdateTicket {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepository,
  ) {}

  async execute(ticketId: string, changes: TicketChanges): Promise<Ticket> {
    const current = await this.tickets.findByTicketId(ticketId);
    if (!current) {
      throw new TicketNotFoundError(ticketId);
    }
    // 저장 사이에 삭제되면 저장소가 null을 돌려준다.
    const updated = await this.tickets.update(current.update(changes));
    if (!updated) {
      throw new TicketNotFoundError(ticketId);
    }
    return updated;
  }
}
