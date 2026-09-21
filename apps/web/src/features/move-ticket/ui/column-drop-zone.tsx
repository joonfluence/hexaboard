'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Ticket, TicketStatus } from '@todo/api-client';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { columnDroppableId } from '../model/plan-move';

/** 카드를 놓을 수 있는 컬럼 본문. 비어 있는 컬럼에도 놓을 수 있다. */
export function ColumnDropZone({
  status,
  tickets,
  children,
}: {
  status: TicketStatus;
  tickets: readonly Ticket[];
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDroppableId(status),
  });
  return (
    <SortableContext
      items={tickets.map((ticket) => ticket.ticketId)}
      strategy={verticalListSortingStrategy}
    >
      <ul
        ref={setNodeRef}
        className={cn(
          'flex min-h-16 flex-col gap-2 rounded-md p-1',
          isOver && 'bg-blue-100/60',
        )}
      >
        {children}
      </ul>
    </SortableContext>
  );
}
