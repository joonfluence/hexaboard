import type { Ticket, TicketStatus } from '@todo/api-client';

/** 테스트용 티켓. `id`가 곧 제목과 `ticketId`다. */
export function aTicket(
  id: string,
  status: TicketStatus = 'TODO',
  overrides: Partial<Ticket> = {},
): Ticket {
  return {
    ticketId: id,
    title: `제목 ${id}`,
    description: null,
    status,
    priority: 'MEDIUM',
    dueAt: null,
    tags: [],
    createdAt: '2026-09-20T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
    ...overrides,
  };
}
