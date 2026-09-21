'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Ticket, UpdateTicketBody } from '@todo/api-client';
import { useApiClient } from '@/shared/api/client';
import { unwrap } from '@/shared/api/errors';

/** 목록은 페이지네이션 없이 하나의 캐시 항목이다(D-63). */
export const ticketKeys = { all: ['tickets'] as const };

export function useTicketsQuery() {
  const client = useApiClient();
  return useQuery({
    queryKey: ticketKeys.all,
    queryFn: (): Promise<Ticket[]> => unwrap(client.GET('/v1/tickets')),
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
