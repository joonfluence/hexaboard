import { Position } from '../src/position';
import { sortTickets } from '../src/sort';
import { Ticket } from '../src/ticket';

const t = (title: string, priority: string, dueAt: string | null, n: number) =>
  Ticket.rehydrate({
    ticketId: `0194f0a6-1b2c-4d3e-8f4a-5b6c7d8e9f0${n}`,
    title,
    description: null,
    status: 'TODO',
    priority,
    dueAt: dueAt ? new Date(dueAt) : null,
    position: `a${n}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
const titles = (list: Ticket[]) => list.map((x) => x.title.value);

const sample = () => [
  t('a', 'HIGH', '2026-10-02T00:00:00Z', 1),
  t('b', 'LOW', null, 2),
  t('c', 'HIGH', '2026-10-01T00:00:00Z', 3),
  t('d', 'URGENT', null, 4),
  t('e', 'LOW', '2026-10-03T00:00:00Z', 5),
];

describe('sortTickets (006)', () => {
  it('TC-DOM-057: 우선순위 정렬, 같은 우선순위는 기존 순서를 유지한다', () => {
    expect(titles(sortTickets(sample(), 'PRIORITY', 'ASC'))).toEqual([
      'b',
      'e',
      'a',
      'c',
      'd',
    ]);
    expect(titles(sortTickets(sample(), 'PRIORITY', 'DESC'))).toEqual([
      'd',
      'a',
      'c',
      'b',
      'e',
    ]);
  });

  it('TC-DOM-058: 마감일 정렬', () => {
    expect(titles(sortTickets(sample(), 'DUE_AT', 'ASC')).slice(0, 3)).toEqual([
      'c',
      'a',
      'e',
    ]);
    expect(titles(sortTickets(sample(), 'DUE_AT', 'DESC')).slice(0, 3)).toEqual(
      ['e', 'a', 'c'],
    );
  });

  it.each(['ASC', 'DESC'] as const)(
    'TC-DOM-059: 마감일 없는 티켓은 %s에서도 맨 뒤이고 기존 순서를 유지한다',
    (direction) => {
      expect(
        titles(sortTickets(sample(), 'DUE_AT', direction)).slice(3),
      ).toEqual(['b', 'd']);
    },
  );

  it('TC-DOM-060: 입력을 바꾸지 않는다', () => {
    const input = sample();
    sortTickets(input, 'PRIORITY', 'DESC');
    expect(titles(input)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(Position.first().value).toBe('a0');
  });
});
