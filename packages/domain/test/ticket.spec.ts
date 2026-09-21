import { InvalidTitleError } from '../src/errors';
import { Position } from '../src/position';
import { Ticket, TICKET_STATUSES } from '../src/ticket';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('Ticket.create', () => {
  const position = Position.first();

  it('공개 식별자는 UUID v4 형식이다', () => {
    expect(Ticket.create({ title: '문서 정리', position }).ticketId).toMatch(
      UUID_V4,
    );
  });

  it('호출마다 서로 다른 식별자를 만든다 (C6)', () => {
    const a = Ticket.create({ title: '같은 내용', position });
    const b = Ticket.create({ title: '같은 내용', position });
    expect(a.ticketId).not.toBe(b.ticketId);
  });

  it('상태는 항상 TODO다', () => {
    expect(Ticket.create({ title: 't', position }).status).toBe('TODO');
  });

  it('제목만 주면 우선순위 MEDIUM, 설명·마감일 없음이다 (C1)', () => {
    const ticket = Ticket.create({ title: 't', position });
    expect(ticket.priority.value).toBe('MEDIUM');
    expect(ticket.description).toBeNull();
    expect(ticket.dueAt).toBeNull();
  });

  it('입력한 값을 그대로 보관한다 (C2)', () => {
    const dueAt = new Date('2026-12-31T23:59:00.000Z');
    const ticket = Ticket.create({
      title: '문서 정리',
      description: '설명',
      priority: 'HIGH',
      dueAt,
      position,
    });
    expect(ticket.title.value).toBe('문서 정리');
    expect(ticket.description).toBe('설명');
    expect(ticket.priority.value).toBe('HIGH');
    expect(ticket.dueAt).toEqual(dueAt);
    expect(ticket.position).toBe(position);
  });

  it('제목과 설명을 정규화한다 (C3, C4)', () => {
    const ticket = Ticket.create({
      title: '  제목  ',
      description: '   ',
      position,
    });
    expect(ticket.title.value).toBe('제목');
    expect(ticket.description).toBeNull();
  });

  it('잘못된 제목은 도메인 오류로 거부한다 (V1)', () => {
    expect(() => Ticket.create({ title: '  ', position })).toThrow(
      InvalidTitleError,
    );
  });

  it('DB 내부 식별자를 갖지 않는다', () => {
    const keys = Object.keys(Ticket.create({ title: 't', position }));
    expect(keys).not.toContain('id');
    expect(keys).toContain('ticketId');
  });
});

describe('Ticket.rehydrate', () => {
  const stored = {
    ticketId: '0194f0a6-1b2c-4d3e-8f4a-5b6c7d8e9f00',
    title: '저장된 제목',
    description: null,
    status: 'IN_PROGRESS' as const,
    priority: 'URGENT',
    dueAt: new Date('2026-12-31T23:59:00.000Z'),
    position: 'a1',
    createdAt: new Date('2026-09-21T00:00:00.000Z'),
    updatedAt: new Date('2026-09-21T01:00:00.000Z'),
  };

  it('저장된 값 그대로 복원하고 새 식별자를 만들지 않는다', () => {
    const ticket = Ticket.rehydrate(stored);
    expect(ticket.ticketId).toBe(stored.ticketId);
    expect(ticket.title.value).toBe('저장된 제목');
    expect(ticket.status).toBe('IN_PROGRESS');
    expect(ticket.priority.value).toBe('URGENT');
    expect(ticket.dueAt).toEqual(stored.dueAt);
    expect(ticket.position.value).toBe('a1');
  });

  it('ORM이 채운 생성·수정 시각을 보관한다', () => {
    const ticket = Ticket.rehydrate(stored);
    expect(ticket.createdAt).toEqual(stored.createdAt);
    expect(ticket.updatedAt).toEqual(stored.updatedAt);
  });

  it('새로 만든 티켓은 아직 저장 전이라 시각이 없다', () => {
    const ticket = Ticket.create({ title: 't', position: Position.first() });
    expect(ticket.createdAt).toBeUndefined();
    expect(ticket.updatedAt).toBeUndefined();
  });

  it('저장된 값이 도메인 규칙에 어긋나면 거부한다', () => {
    expect(() => Ticket.rehydrate({ ...stored, title: '   ' })).toThrow(
      InvalidTitleError,
    );
  });
});

describe('TICKET_STATUSES', () => {
  it('TC-DOM-038: 상태 목록을 TODO, IN_PROGRESS, DONE 순서로 노출한다', () => {
    expect(TICKET_STATUSES).toEqual(['TODO', 'IN_PROGRESS', 'DONE']);
  });
});
