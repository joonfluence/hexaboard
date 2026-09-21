import { PRIORITY_VALUES, type PriorityValue } from './priority';
import type { Ticket } from './ticket';

export const SORT_BY = ['PRIORITY', 'DUE_AT'] as const;
export type SortBy = (typeof SORT_BY)[number];
export const SORT_DIRECTIONS = ['ASC', 'DESC'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

const rank = (priority: PriorityValue) => PRIORITY_VALUES.indexOf(priority);

/**
 * 정렬 기준·방향대로 정렬한 새 배열. 같은 값끼리는 입력 순서를 유지한다(안정 정렬).
 * 마감일이 없는 티켓은 방향과 무관하게 항상 맨 뒤다(FR-09).
 */
export function sortTickets(
  tickets: readonly Ticket[],
  sortBy: SortBy,
  direction: SortDirection,
): Ticket[] {
  const sign = direction === 'ASC' ? 1 : -1;
  return tickets.toSorted((a, b) => {
    if (sortBy === 'PRIORITY') {
      return sign * (rank(a.priority.value) - rank(b.priority.value));
    }
    if (a.dueAt === null || b.dueAt === null) {
      return (a.dueAt === null ? 1 : 0) - (b.dueAt === null ? 1 : 0);
    }
    return sign * (a.dueAt.getTime() - b.dueAt.getTime());
  });
}
