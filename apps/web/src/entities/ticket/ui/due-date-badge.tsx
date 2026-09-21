import { cn } from '@/shared/lib/cn';
import { formatDueAt } from '../model/due-date';

/** 마감일이 있을 때만 쓴다. 지났으면 "초과"를 함께 표시한다(D-96). */
export function DueDateBadge({ dueAt }: { dueAt: string }) {
  const { text, overdue } = formatDueAt(dueAt);
  return (
    <span
      data-overdue={overdue}
      className={cn(
        'rounded px-1.5 py-0.5 text-xs',
        overdue ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700',
      )}
    >
      {text}
      {overdue ? ' 초과' : ''}
    </span>
  );
}
