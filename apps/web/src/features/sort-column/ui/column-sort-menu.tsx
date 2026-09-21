'use client';

import type { TicketStatus } from '@todo/api-client';
import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Select } from '@/shared/ui/field';
import { useSortColumn, type SortRequest } from '../model/use-sort-column';

/**
 * 컬럼 헤더의 정렬 메뉴(컬럼 단위 정렬이므로 헤더에 둔다, D-56). 실행하면 그 컬럼의 수동 순서를 덮어쓰며
 * 실행 취소는 없다. 필터가 켜진 동안에는 숨겨진 카드의 순서를 건드리지 않도록 비활성이다(D-57).
 */
export function ColumnSortMenu({
  status,
  disabled,
}: {
  status: TicketStatus;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortRequest['sortBy']>('PRIORITY');
  const [direction, setDirection] = useState<SortRequest['direction']>('ASC');
  const sort = useSortColumn();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        aria-expanded={open}
        disabled={disabled}
        title={disabled ? '필터를 해제하면 정렬할 수 있습니다.' : undefined}
        onClick={() => setOpen(!open)}
        className="px-2 py-0.5 text-xs"
      >
        정렬
      </Button>
      {open && !disabled ? (
        <div className="absolute right-0 z-10 mt-1 flex w-44 flex-col gap-2 rounded-md bg-white p-2 shadow-lg">
          <label className="flex flex-col gap-1 text-xs">
            정렬 기준
            <Select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as SortRequest['sortBy'])
              }
            >
              <option value="PRIORITY">우선순위</option>
              <option value="DUE_AT">마감일</option>
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            정렬 방향
            <Select
              value={direction}
              onChange={(event) =>
                setDirection(event.target.value as SortRequest['direction'])
              }
            >
              <option value="ASC">오름차순</option>
              <option value="DESC">내림차순</option>
            </Select>
          </label>
          <Button
            disabled={sort.isPending}
            onClick={() =>
              sort.mutate(
                { status, sortBy, direction },
                { onSuccess: () => setOpen(false) },
              )
            }
          >
            실행
          </Button>
        </div>
      ) : null}
    </div>
  );
}
