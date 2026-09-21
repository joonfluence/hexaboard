import {
  InvalidDescriptionError,
  InvalidPriorityError,
  InvalidTitleError,
} from '../src/errors';
import { Position } from '../src/position';
import { Ticket } from '../src/ticket';

const created = new Date('2026-09-20T00:00:00.000Z');
const stored = () =>
  Ticket.rehydrate({
    ticketId: '0194f0a6-1b2c-4d3e-8f4a-5b6c7d8e9f00',
    title: '원래 제목',
    description: '원래 설명',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueAt: new Date('2026-12-31T00:00:00.000Z'),
    position: 'a3',
    createdAt: created,
    updatedAt: created,
  });

describe('Ticket.update', () => {
  it('TC-DOM-039: 변경 없이 수정하면 값이 그대로다', () => {
    const before = stored();
    const after = before.update({});

    expect(after.title.value).toBe('원래 제목');
    expect(after.description).toBe('원래 설명');
    expect(after.priority.value).toBe('HIGH');
    expect(after.dueAt).toEqual(new Date('2026-12-31T00:00:00.000Z'));
  });

  it('TC-DOM-040: 제목은 앞뒤 공백을 제거해 반영한다', () => {
    expect(stored().update({ title: '  새 제목  ' }).title.value).toBe(
      '새 제목',
    );
  });

  it.each([
    ['빈 값', ''],
    ['공백뿐', '   '],
    ['null', null],
    ['101자', 'a'.repeat(101)],
  ])('TC-DOM-041: 제목이 %s이면 거부한다', (_label, title) => {
    expect(() => stored().update({ title })).toThrow(InvalidTitleError);
  });

  it('TC-DOM-042: 설명은 새 값으로 바꾸고, 비우면 null, 생략하면 유지한다', () => {
    expect(stored().update({ description: '새 설명' }).description).toBe(
      '새 설명',
    );
    expect(stored().update({ description: '' }).description).toBeNull();
    expect(stored().update({ description: '   ' }).description).toBeNull();
    expect(stored().update({ description: null }).description).toBeNull();
    expect(stored().update({ title: 't' }).description).toBe('원래 설명');
  });

  it('TC-DOM-043: 설명이 2001자면 거부한다', () => {
    expect(() => stored().update({ description: 'a'.repeat(2001) })).toThrow(
      InvalidDescriptionError,
    );
  });

  it.each([[null], ['NORMAL'], [3]])(
    'TC-DOM-044: 우선순위 %p은 거부한다',
    (priority) => {
      expect(() => stored().update({ priority })).toThrow(InvalidPriorityError);
    },
  );

  it('TC-DOM-044: 우선순위를 새 값으로 바꾼다', () => {
    expect(stored().update({ priority: 'URGENT' }).priority.value).toBe(
      'URGENT',
    );
  });

  it('TC-DOM-045: 마감일은 새 값으로 바꾸고, null이면 해제, 생략하면 유지한다', () => {
    const next = new Date('2027-01-01T00:00:00.000Z');
    expect(stored().update({ dueAt: next }).dueAt).toEqual(next);
    expect(stored().update({ dueAt: null }).dueAt).toBeNull();
    expect(stored().update({ title: 't' }).dueAt).toEqual(
      new Date('2026-12-31T00:00:00.000Z'),
    );
  });

  it('TC-DOM-046: 식별자·상태·순서 키·생성 시각은 그대로이고 원본은 바뀌지 않는다', () => {
    const before = stored();
    const after = before.update({ title: '바뀐 제목', priority: 'LOW' });

    expect(after).not.toBe(before);
    expect(after.ticketId).toBe(before.ticketId);
    expect(after.status).toBe('IN_PROGRESS');
    expect(after.position.value).toBe('a3');
    expect(after.createdAt).toEqual(created);
    expect(before.title.value).toBe('원래 제목');
    expect(before.priority.value).toBe('HIGH');
  });
});

describe('Ticket.moveTo (004)', () => {
  it('TC-DOM-055: 상태와 순서 키만 바뀐 새 티켓을 돌려주고 원본은 그대로다', () => {
    const before = stored();
    const after = before.moveTo('DONE', Position.from('a9'));

    expect(after).not.toBe(before);
    expect(after.status).toBe('DONE');
    expect(after.position.value).toBe('a9');
    expect(after.ticketId).toBe(before.ticketId);
    expect(after.title.value).toBe(before.title.value);
    expect(after.priority.value).toBe('HIGH');
    expect(before.status).toBe('IN_PROGRESS');
    expect(before.position.value).toBe('a3');
  });
});
