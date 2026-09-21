import type { Ticket, TicketStatus } from '@todo/api-client';
import { InlineTicketForm } from '@/features/create-ticket/ui/inline-ticket-form';
import { ColumnDropZone } from '@/features/move-ticket/ui/column-drop-zone';
import { SortableTicketCard } from '@/features/move-ticket/ui/sortable-ticket-card';

/** 한 상태의 컬럼. 카드 목록(놓기 대상)과, 할 일 컬럼에는 하단 인라인 생성 입력이 있다. */
export function BoardColumn({
  status,
  title,
  tickets,
  onOpenTicket,
}: {
  status: TicketStatus;
  title: string;
  tickets: readonly Ticket[];
  onOpenTicket: (ticketId: string) => void;
}) {
  return (
    <section
      aria-label={title}
      className="flex w-72 shrink-0 flex-col rounded-lg bg-slate-200 p-2"
    >
      <h2 className="px-1 pb-2 text-sm font-semibold text-slate-700">
        {title}{' '}
        <span className="font-normal text-slate-500">{tickets.length}</span>
      </h2>
      <ColumnDropZone status={status} tickets={tickets}>
        {tickets.map((ticket) => (
          <SortableTicketCard
            key={ticket.ticketId}
            ticket={ticket}
            onOpen={onOpenTicket}
          />
        ))}
      </ColumnDropZone>
      {tickets.length === 0 ? (
        <p className="px-1 py-2 text-sm text-slate-500">카드 없음</p>
      ) : null}
      {status === 'TODO' ? <InlineTicketForm /> : null}
    </section>
  );
}
