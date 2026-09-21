import type { TicketPriority } from '@todo/api-client';

export const PRIORITIES: readonly TicketPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
];

const LABELS: Record<TicketPriority, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

export const priorityLabel = (priority: TicketPriority): string =>
  LABELS[priority];
