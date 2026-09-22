import { Inject, Injectable } from '@nestjs/common';
import {
  Position,
  sortTickets,
  type SortBy,
  type SortDirection,
  type TicketStatus,
} from '@todo/domain';
import type { TicketRepository } from './ticket.repository';
import { TICKET_REPOSITORY } from './tokens';

export interface SortColumnInput {
  status: TicketStatus;
  sortBy: SortBy;
  direction: SortDirection;
}

/** 컬럼의 카드를 정렬하고 순서 키를 첫 키부터 다시 매긴다(수동 순서를 덮어쓴다, FR-09). */
export interface SortColumn {
  execute(input: SortColumnInput): Promise<void>;
}

@Injectable()
export class SortColumnService implements SortColumn {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepository,
  ) {}

  async execute(input: SortColumnInput): Promise<void> {
    const sorted = sortTickets(
      await this.tickets.findByStatus(input.status),
      input.sortBy,
      input.direction,
    );
    let position: Position | null = null;
    const assignments = sorted.map((ticket) => {
      position = position ? Position.after(position) : Position.first();
      return { ticketId: ticket.ticketId, position };
    });
    await this.tickets.reorder(input.status, assignments);
  }
}
