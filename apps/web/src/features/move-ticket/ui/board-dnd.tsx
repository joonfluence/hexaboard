'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState, type ReactNode } from 'react';
import { COLUMNS, type Board } from '@/entities/ticket/model/board';
import { TicketCard } from '@/entities/ticket/ui/ticket-card';
import { useMoveTicket } from '../model/use-move-ticket';
import { planMove } from '../model/plan-move';

/**
 * 보드 전체의 드래그 앤 드롭. 놓은 결과는 `planMove`가 이동 요청으로 바꾸고 `useMoveTicket`이 처리한다.
 * 클릭(상세 열기)과 드래그를 구분하려고 포인터는 6px 움직여야 드래그가 시작된다.
 */
export function BoardDnd({
  board,
  children,
}: {
  board: Board;
  children: ReactNode;
}) {
  const { move } = useMoveTicket();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter는 카드의 상세 열기에 쓰므로 Space로만 드래그를 시작한다.
      keyboardCodes: {
        start: ['Space'],
        cancel: ['Escape'],
        end: ['Space', 'Enter'],
      },
    }),
  );

  const active = activeId
    ? COLUMNS.flatMap((c) => board[c.status]).find(
        (t) => t.ticketId === activeId,
      )
    : undefined;

  const onDragStart = ({ active }: DragStartEvent) =>
    setActiveId(String(active.id));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;
    const dragged = active.rect.current.translated;
    const below = dragged
      ? dragged.top > over.rect.top + over.rect.height / 2
      : false;
    const plan = planMove(board, String(active.id), String(over.id), { below });
    if (plan) void move(plan);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {children}
      <DragOverlay>
        {active ? (
          <TicketCard ticket={active} onOpen={() => undefined} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
