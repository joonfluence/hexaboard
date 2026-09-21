'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Ticket } from '@todo/api-client';
import { TicketCard } from '@/entities/ticket/ui/ticket-card';

/** 드래그할 수 있는 카드. 카드 자체(버튼)는 그대로 두고 감싸는 요소가 드래그를 맡는다. */
export function SortableTicketCard({
  ticket,
  onOpen,
}: {
  ticket: Ticket;
  onOpen: (ticketId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.ticketId });
  // 안쪽 버튼이 초점을 받으므로 감싸는 요소의 role·tabIndex는 제거한다(중첩된 상호작용 요소 방지).
  const { role: _role, tabIndex: _tabIndex, ...rest } = attributes;
  void _role;
  void _tabIndex;

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...rest}
      {...listeners}
    >
      <TicketCard ticket={ticket} onOpen={onOpen} />
    </li>
  );
}
