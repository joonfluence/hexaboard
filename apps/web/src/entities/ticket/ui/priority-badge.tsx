import type { TicketPriority } from '@todo/api-client';
import { cn } from '@/shared/lib/cn';
import { priorityLabel } from '../model/priority';

const COLORS: Record<TicketPriority, string> = {
  LOW: 'bg-slate-200 text-slate-700',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

/** 우선순위는 항상 있으므로 항상 표시한다. 단계는 문구와 색으로 구분한다(FR-06). */
export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      data-priority={priority}
      className={cn(
        'rounded px-1.5 py-0.5 text-xs font-medium',
        COLORS[priority],
      )}
    >
      {priorityLabel(priority)}
    </span>
  );
}
