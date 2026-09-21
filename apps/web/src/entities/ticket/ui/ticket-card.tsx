import type { Ticket } from '@todo/api-client';
import { DueDateBadge } from './due-date-badge';
import { PriorityBadge } from './priority-badge';

/** 티켓 한 장. 제목과 우선순위·마감일 배지를 보여 주고 누르면 상세를 연다(D-56). */
export function TicketCard({
  ticket,
  onOpen,
}: {
  ticket: Ticket;
  onOpen: (ticketId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(ticket.ticketId)}
      className="flex w-full flex-col gap-2 rounded-md bg-white p-2.5 text-left text-sm shadow-sm hover:bg-slate-50"
    >
      <span className="font-medium break-words">{ticket.title}</span>
      <span className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={ticket.priority} />
        {ticket.dueAt ? <DueDateBadge dueAt={ticket.dueAt} /> : null}
      </span>
    </button>
  );
}
