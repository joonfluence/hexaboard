import { describe, expect, it } from 'vitest';
import { formatDueAt } from '@/entities/ticket/model/due-date';
import { COLUMNS, groupByStatus } from '@/entities/ticket/model/board';
import { priorityLabel } from '@/entities/ticket/model/priority';
import { aTicket } from './helpers/tickets';

describe('보드 모델', () => {
  it('TC-UI-001: 컬럼은 TODO·IN_PROGRESS·DONE 세 개뿐이다', () => {
    expect(COLUMNS.map((column) => column.status)).toEqual([
      'TODO',
      'IN_PROGRESS',
      'DONE',
    ]);
  });

  it('TC-UI-002·003: 상태별로 나누고 서버가 준 순서를 그대로 유지한다', () => {
    const tickets = [
      aTicket('a', 'TODO'),
      aTicket('x', 'DONE'),
      aTicket('b', 'TODO'),
      aTicket('m', 'IN_PROGRESS'),
      aTicket('y', 'DONE'),
    ];

    const board = groupByStatus(tickets);

    expect(board.TODO.map((t) => t.ticketId)).toEqual(['a', 'b']);
    expect(board.IN_PROGRESS.map((t) => t.ticketId)).toEqual(['m']);
    expect(board.DONE.map((t) => t.ticketId)).toEqual(['x', 'y']);
  });

  it('TC-UI-039: 우선순위 문구는 낮음·보통·높음·긴급이다', () => {
    expect(
      (['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map(priorityLabel),
    ).toEqual(['낮음', '보통', '높음', '긴급']);
  });

  it('TC-UI-040: 마감일은 M월 D일 HH:mm으로 표시하고 지났으면 초과로 표시한다', () => {
    const now = new Date('2026-09-21T12:00:00.000Z');

    expect(formatDueAt('2026-12-31T23:59:00.000Z', now)).toEqual({
      text: '12월 31일 23:59',
      overdue: false,
    });
    expect(formatDueAt('2026-09-05T08:05:00.000Z', now)).toEqual({
      text: '9월 5일 08:05',
      overdue: true,
    });
  });
});
