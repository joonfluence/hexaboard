import { Position, Ticket } from '@todo/domain';
import { TicketMapper } from '../src/ticket.mapper';

describe('TicketMapper', () => {
  const mapper = new TicketMapper();
  const ticket = Ticket.create({
    title: '문서 정리',
    description: '설명',
    priority: 'HIGH',
    dueAt: new Date('2026-12-31T23:59:00.000Z'),
    position: Position.first(),
  });

  it('공개 식별자 ticketId는 public_id 값(publicId)에 대응한다', () => {
    expect(mapper.toEntity(ticket).publicId).toBe(ticket.ticketId);
  });

  it('새 엔티티에는 내부 PK(id)가 아직 없다', () => {
    expect(mapper.toEntity(ticket).id).toBeUndefined();
  });

  it.each([
    ['LOW', 1],
    ['MEDIUM', 2],
    ['HIGH', 3],
    ['URGENT', 4],
  ])('우선순위 %s는 숫자 %i로 저장한다', (priority, stored) => {
    expect(mapper.priorityToNumber(priority)).toBe(stored);
    expect(mapper.numberToPriority(stored)).toBe(priority);
  });

  it('우선순위 숫자 순서가 LOW < MEDIUM < HIGH < URGENT다', () => {
    const numbers = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) =>
      mapper.priorityToNumber(p),
    );
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
  });

  it('알 수 없는 우선순위 숫자는 거부한다', () => {
    expect(() => mapper.numberToPriority(9)).toThrow();
  });

  it('도메인 → 엔티티 → 도메인으로 왕복해도 값이 같다', () => {
    const entity = mapper.toEntity(ticket);
    entity.id = '1';
    entity.createdAt = new Date('2026-09-21T00:00:00.000Z');
    entity.updatedAt = new Date('2026-09-21T00:00:00.000Z');

    const restored = mapper.toDomain(entity);
    expect(restored.ticketId).toBe(ticket.ticketId);
    expect(restored.title.value).toBe('문서 정리');
    expect(restored.description).toBe('설명');
    expect(restored.status).toBe('TODO');
    expect(restored.priority.value).toBe('HIGH');
    expect(restored.dueAt).toEqual(ticket.dueAt);
    expect(restored.position.value).toBe(ticket.position.value);
    expect(restored.createdAt).toEqual(entity.createdAt);
  });

  it('복원한 도메인 티켓에는 내부 PK가 없다', () => {
    const entity = mapper.toEntity(ticket);
    entity.id = '42';
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    expect(Object.keys(mapper.toDomain(entity))).not.toContain('id');
  });
});
