'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  Ticket,
  TicketPriority,
  UpdateTicketBody,
} from '@todo/api-client';
import { useApiClient } from '@/shared/api/client';
import { unwrap } from '@/shared/api/errors';

/** 목록 조건. 종류가 다르면 AND, 같은 종류의 여러 값은 OR이다(서버가 실행한다, FR-08). */
export interface TicketFilter {
  q: string;
  priorities: TicketPriority[];
  tags: string[];
}

export const EMPTY_FILTER: TicketFilter = { q: '', priorities: [], tags: [] };

export const isFilterActive = (filter: TicketFilter): boolean =>
  filter.q.trim() !== '' ||
  filter.priorities.length > 0 ||
  filter.tags.length > 0;

/** 목록은 페이지네이션 없이 조건별로 하나의 캐시 항목이다(D-63). 변경 뒤에는 `all`로 모두 무효화한다. */
export const ticketKeys = {
  all: ['tickets'] as const,
  list: (filter: TicketFilter) => ['tickets', filter] as const,
};

export function useTicketsQuery(filter: TicketFilter = EMPTY_FILTER) {
  const client = useApiClient();
  return useQuery({
    queryKey: ticketKeys.list(filter),
    queryFn: (): Promise<Ticket[]> =>
      unwrap(
        client.GET('/v1/tickets', {
          params: {
            query: {
              q: filter.q.trim() || undefined,
              priority: filter.priorities.length
                ? filter.priorities
                : undefined,
              tag: filter.tags.length ? filter.tags : undefined,
            },
          },
        }),
      ),
    // 조건을 바꾸는 동안 이전 결과를 보여 주어 화면이 깜빡이지 않게 한다.
    placeholderData: keepPreviousData,
  });
}

export function useCreateTicket() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      unwrap(client.POST('/v1/tickets', { body: { title } })),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ticketKeys.all }),
  });
}

export function useUpdateTicket() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      body,
    }: {
      ticketId: string;
      body: UpdateTicketBody;
    }) =>
      unwrap(
        client.PATCH('/v1/tickets/{ticketId}', {
          params: { path: { ticketId } },
          body,
        }),
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ticketKeys.all }),
  });
}

export function useDeleteTicket() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) =>
      unwrap(
        client.DELETE('/v1/tickets/{ticketId}', {
          params: { path: { ticketId } },
        }),
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ticketKeys.all }),
  });
}
