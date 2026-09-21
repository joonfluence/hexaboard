import type { MovePositionBody, Ticket, TicketStatus } from '@todo/api-client';
import { COLUMNS, type Board } from '@/entities/ticket/model/board';

const COLUMN_PREFIX = 'column:';

/** 컬럼 본문에 놓았을 때의 dnd 대상 id. 카드 id(UUID)와 겹치지 않는다. */
export const columnDroppableId = (status: TicketStatus): string =>
  `${COLUMN_PREFIX}${status}`;

const statusOfDroppable = (id: string): TicketStatus | undefined =>
  COLUMNS.find((column) => columnDroppableId(column.status) === id)?.status;

export interface MovePlan {
  ticketId: string;
  /** 서버에 보낼 요청. `position` 값은 없다(서버가 계산한다, 헌법 IV). */
  request: MovePositionBody;
  /** 응답을 기다리지 않고 먼저 보여 줄 보드(낙관적 업데이트). */
  board: Board;
}

/**
 * 드래그 결과(`activeId`를 `overId` 위에 놓음)를 이동 요청과 낙관적 보드로 바꾼다. 이동이 아니면 null.
 * - 컬럼 본문에 놓으면 그 컬럼의 맨 뒤(비어 있으면 기준 카드 없음).
 * - 같은 컬럼의 카드 위: 아래로 옮기면 그 카드의 뒤, 위로 옮기면 앞.
 * - 다른 컬럼의 카드 위: 기본은 앞, `below`(포인터가 카드 아래쪽)면 뒤.
 */
export function planMove(
  board: Board,
  activeId: string,
  overId: string,
  options: { below?: boolean } = {},
): MovePlan | null {
  const active = COLUMNS.flatMap((c) => board[c.status]).find(
    (ticket) => ticket.ticketId === activeId,
  );
  if (!active || activeId === overId) {
    return null;
  }

  const overColumn = statusOfDroppable(overId);
  const overTicket = COLUMNS.flatMap((c) => board[c.status]).find(
    (ticket) => ticket.ticketId === overId,
  );
  const status = overColumn ?? overTicket?.status;
  if (!status) {
    return null;
  }

  const target = board[status].filter((t) => t.ticketId !== activeId);
  let request: MovePositionBody;
  let index: number;
  if (overTicket) {
    const overIndex = target.findIndex((t) => t.ticketId === overId);
    const sameColumn = active.status === status;
    const movingDown =
      sameColumn &&
      board[status].findIndex((t) => t.ticketId === activeId) <
        board[status].findIndex((t) => t.ticketId === overId);
    const after = sameColumn ? movingDown : (options.below ?? false);
    request = {
      status,
      anchorTicketId: overId,
      placement: after ? 'AFTER' : 'BEFORE',
    };
    index = after ? overIndex + 1 : overIndex;
  } else {
    const last = target[target.length - 1];
    request = last
      ? { status, anchorTicketId: last.ticketId, placement: 'AFTER' }
      : { status, placement: 'AFTER' };
    index = target.length;
  }

  const moved: Ticket = { ...active, status };
  const nextColumn = [...target.slice(0, index), moved, ...target.slice(index)];
  const unchanged =
    active.status === status &&
    nextColumn.every((t, i) => t.ticketId === board[status][i]?.ticketId);
  if (unchanged) {
    return null;
  }

  const next: Board = { ...board, [status]: nextColumn };
  if (active.status !== status) {
    next[active.status] = board[active.status].filter(
      (t) => t.ticketId !== activeId,
    );
  }
  return { ticketId: activeId, request, board: next };
}
