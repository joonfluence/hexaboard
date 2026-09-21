import { describe, expect, it } from 'vitest';
import { groupByStatus } from '@/entities/ticket/model/board';
import {
  columnDroppableId,
  planMove,
} from '@/features/move-ticket/model/plan-move';
import { aTicket } from './helpers/tickets';

const board = () =>
  groupByStatus([
    aTicket('a', 'TODO'),
    aTicket('b', 'TODO'),
    aTicket('c', 'TODO'),
    aTicket('d', 'IN_PROGRESS'),
  ]);
const ids = (tickets: { ticketId: string }[]) => tickets.map((t) => t.ticketId);

describe('planMove: 드래그 결과를 이동 요청으로 바꾼다', () => {
  it('TC-UI-027: 다른 컬럼 본문에 놓으면 그 컬럼의 상태로 요청한다', () => {
    const plan = planMove(board(), 'a', columnDroppableId('IN_PROGRESS'));

    expect(plan?.request).toEqual({
      status: 'IN_PROGRESS',
      anchorTicketId: 'd',
      placement: 'AFTER',
    });
  });

  it('TC-UI-028: 같은 컬럼에서 아래 카드 위에 놓으면 그 카드의 뒤, 위 카드 위에 놓으면 앞이다', () => {
    expect(planMove(board(), 'a', 'c')?.request).toEqual({
      status: 'TODO',
      anchorTicketId: 'c',
      placement: 'AFTER',
    });
    expect(planMove(board(), 'c', 'a')?.request).toEqual({
      status: 'TODO',
      anchorTicketId: 'a',
      placement: 'BEFORE',
    });
  });

  it('TC-UI-028: 다른 컬럼의 카드 위에 놓으면 기본은 앞, 카드 아래쪽이면 뒤다', () => {
    expect(planMove(board(), 'a', 'd')?.request).toEqual({
      status: 'IN_PROGRESS',
      anchorTicketId: 'd',
      placement: 'BEFORE',
    });
    expect(planMove(board(), 'a', 'd', { below: true })?.request).toEqual({
      status: 'IN_PROGRESS',
      anchorTicketId: 'd',
      placement: 'AFTER',
    });
  });

  it('TC-UI-029: 빈 컬럼에 놓으면 기준 카드 없이 요청한다', () => {
    const request = planMove(board(), 'a', columnDroppableId('DONE'))?.request;

    expect(request).toEqual({ status: 'DONE', placement: 'AFTER' });
    expect(request).not.toHaveProperty('anchorTicketId');
  });

  it('TC-UI-030: 낙관적으로 바뀐 보드를 함께 돌려준다(이동한 카드의 상태도 바뀐다)', () => {
    const sameColumn = planMove(board(), 'a', 'c');
    const crossColumn = planMove(board(), 'a', 'd');
    const emptyColumn = planMove(board(), 'b', columnDroppableId('DONE'));

    expect(ids(sameColumn!.board.TODO)).toEqual(['b', 'c', 'a']);
    expect(ids(crossColumn!.board.TODO)).toEqual(['b', 'c']);
    expect(ids(crossColumn!.board.IN_PROGRESS)).toEqual(['a', 'd']);
    expect(crossColumn!.board.IN_PROGRESS[0]?.status).toBe('IN_PROGRESS');
    expect(ids(emptyColumn!.board.DONE)).toEqual(['b']);
  });

  it('TC-UI-030: 원래 보드는 바꾸지 않는다', () => {
    const original = board();
    planMove(original, 'a', 'd');

    expect(ids(original.TODO)).toEqual(['a', 'b', 'c']);
  });

  it('TC-UI-035: 요청에는 position 값이 없다', () => {
    const requests = [
      planMove(board(), 'a', 'c'),
      planMove(board(), 'a', 'd'),
      planMove(board(), 'a', columnDroppableId('DONE')),
    ].map((plan) => Object.keys(plan!.request));

    for (const keys of requests) {
      expect(keys).not.toContain('position');
    }
  });

  it.each([
    ['자기 자신 위', 'a', 'a'],
    ['없는 대상', 'a', 'zzz'],
    ['없는 카드', 'zzz', 'a'],
  ])('%s에 놓으면 이동하지 않는다', (_label, active, over) => {
    expect(planMove(board(), active, over)).toBeNull();
  });

  it('제자리에 놓으면(순서가 그대로) 이동하지 않는다', () => {
    // b를 자기 컬럼 본문에 놓으면 맨 뒤(c 뒤)로 가므로 이동이다. 마지막 카드 c는 제자리다.
    expect(planMove(board(), 'c', columnDroppableId('TODO'))).toBeNull();
    expect(planMove(board(), 'b', columnDroppableId('TODO'))).not.toBeNull();
  });
});
