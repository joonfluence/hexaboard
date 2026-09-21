'use client';

import { useEffect, useState } from 'react';
import type { TicketPriority } from '@todo/api-client';
import { EMPTY_FILTER, type TicketFilter } from '@/entities/ticket/api/queries';
import { PRIORITIES, priorityLabel } from '@/entities/ticket/model/priority';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/field';

const SEARCH_DEBOUNCE_MS = 250;

const toggle = <T,>(list: readonly T[], item: T): T[] =>
  list.includes(item)
    ? list.filter((value) => value !== item)
    : [...list, item];

/**
 * 보드 상단의 검색·필터 바. 검색어(디바운스), 우선순위(여러 개면 OR), 태그(여러 개면 OR)를 고른다.
 * 마감일 조건은 없다(D-65). 태그 후보는 필터 없는 목록에서 뽑아 전달받는다(D-67).
 */
export function FilterBar({
  filter,
  onChange,
  tagCandidates,
}: {
  filter: TicketFilter;
  onChange: (filter: TicketFilter) => void;
  tagCandidates: readonly string[];
}) {
  const [text, setText] = useState(filter.q);

  useEffect(() => {
    if (text === filter.q) return;
    const timer = setTimeout(
      () => onChange({ ...filter, q: text }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [text, filter, onChange]);

  return (
    <form
      role="search"
      aria-label="필터"
      className="mb-4 flex flex-wrap items-center gap-3"
      onSubmit={(event) => event.preventDefault()}
    >
      <Input
        type="search"
        aria-label="검색어"
        placeholder="제목·설명 검색"
        className="w-56"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <fieldset className="flex items-center gap-2">
        <legend className="sr-only">우선순위</legend>
        {PRIORITIES.map((priority: TicketPriority) => (
          <label key={priority} className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={filter.priorities.includes(priority)}
              onChange={() =>
                onChange({
                  ...filter,
                  priorities: toggle(filter.priorities, priority),
                })
              }
            />
            {priorityLabel(priority)}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap items-center gap-1.5">
        {tagCandidates.map((name) => {
          const selected = filter.tags.includes(name);
          return (
            <button
              key={name}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                onChange({ ...filter, tags: toggle(filter.tags, name) })
              }
              className={cn(
                'rounded px-1.5 py-0.5 text-xs',
                selected
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-100 text-emerald-800',
              )}
            >
              {name}
            </button>
          );
        })}
      </div>
      <Button
        variant="ghost"
        onClick={() => {
          setText('');
          onChange(EMPTY_FILTER);
        }}
      >
        필터 해제
      </Button>
    </form>
  );
}
