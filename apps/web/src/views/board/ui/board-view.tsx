'use client';

import { useState } from 'react';
import {
  EMPTY_FILTER,
  isFilterActive,
  useTicketsQuery,
  type TicketFilter,
} from '@/entities/ticket/api/queries';
import { COLUMNS, groupByStatus } from '@/entities/ticket/model/board';
import { TicketDetailModal } from '@/features/edit-ticket/ui/ticket-detail-modal';
import { FilterBar } from '@/features/filter-tickets/ui/filter-bar';
import { BoardDnd } from '@/features/move-ticket/ui/board-dnd';
import { BoardColumn } from '@/widgets/board-column/ui/board-column';
import { Button } from '@/shared/ui/button';

/** 보드 화면. 목록을 한 번 받아 상태별 컬럼으로 나누고 서버 순서를 그대로 보여 준다. */
export function BoardView() {
  const [filter, setFilter] = useState<TicketFilter>(EMPTY_FILTER);
  const { data, isPending, isError, refetch } = useTicketsQuery(filter);
  // 태그 후보는 조건 없는 목록에서 뽑는다(D-67). 조건이 없으면 같은 캐시를 쓴다.
  const { data: everything } = useTicketsQuery();
  const tagCandidates = [
    ...new Set((everything ?? []).flatMap((ticket) => ticket.tags)),
  ].sort();
  const [openId, setOpenId] = useState<string | null>(null);

  if (isPending) {
    return <p className="p-6 text-slate-600">불러오는 중</p>;
  }
  if (isError && !data) {
    return (
      <div role="alert" className="flex items-center gap-3 p-6 text-red-700">
        티켓을 불러오지 못했습니다.
        <Button onClick={() => void refetch()}>다시 시도</Button>
      </div>
    );
  }

  const board = groupByStatus(data ?? []);
  return (
    <main className="min-h-screen p-4">
      <h1 className="mb-4 text-xl font-bold">티켓 보드</h1>
      <FilterBar
        filter={filter}
        onChange={setFilter}
        tagCandidates={tagCandidates}
      />
      <BoardDnd board={board} filter={filter}>
        <div className="flex items-start gap-3 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <BoardColumn
              key={column.status}
              status={column.status}
              title={column.title}
              tickets={board[column.status]}
              onOpenTicket={setOpenId}
              filterActive={isFilterActive(filter)}
            />
          ))}
        </div>
      </BoardDnd>
      {openId ? (
        <TicketDetailModal ticketId={openId} onClose={() => setOpenId(null)} />
      ) : null}
    </main>
  );
}
