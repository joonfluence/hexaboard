'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TicketStatus } from '@todo/api-client';
import { ticketKeys } from '@/entities/ticket/api/queries';
import { useApiClient } from '@/shared/api/client';
import { unwrap } from '@/shared/api/errors';
import { useToast } from '@/shared/ui/toast';

export interface SortRequest {
  status: TicketStatus;
  sortBy: 'PRIORITY' | 'DUE_AT';
  direction: 'ASC' | 'DESC';
}

/** 컬럼 정렬을 실행한다. 서버가 순서를 덮어쓰므로 성공하면 목록을 다시 조회한다(취소 없음, FR-09). */
export function useSortColumn() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (request: SortRequest) =>
      unwrap(client.POST('/v1/tickets/sort', { body: request })),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ticketKeys.all }),
    onError: () => toast.show('정렬하지 못했어요. 잠시 후 다시 시도해 주세요.'),
  });
}
