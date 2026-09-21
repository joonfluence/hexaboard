import type { Ticket, TicketStatus } from '@todo/api-client';

/** 컬럼은 상태 3개로 고정이다(사용자 정의 컬럼 없음, FR-03). */
export const COLUMNS: readonly { status: TicketStatus; title: string }[] = [
  { status: 'TODO', title: '할 일' },
  { status: 'IN_PROGRESS', title: '진행 중' },
  { status: 'DONE', title: '완료' },
];

export type Board = Record<TicketStatus, Ticket[]>;

/** 서버가 준 순서를 그대로 유지한 채 상태별 컬럼으로 나눈다. */
export function groupByStatus(tickets: readonly Ticket[]): Board {
  const board: Board = { TODO: [], IN_PROGRESS: [], DONE: [] };
  for (const ticket of tickets) {
    board[ticket.status].push(ticket);
  }
  return board;
}

/** 컬럼 순서대로 이어 붙인다(서버 목록과 같은 순서). */
export function flattenBoard(board: Board): Ticket[] {
  return COLUMNS.flatMap((column) => board[column.status]);
}
