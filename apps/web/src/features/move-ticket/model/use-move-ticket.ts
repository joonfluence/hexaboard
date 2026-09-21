'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Ticket } from '@todo/api-client';
import { flattenBoard } from '@/entities/ticket/model/board';
import {
  EMPTY_FILTER,
  ticketKeys,
  type TicketFilter,
} from '@/entities/ticket/api/queries';
import { useApiClient } from '@/shared/api/client';
import { unwrap } from '@/shared/api/errors';
import { useToast } from '@/shared/ui/toast';
import type { MovePlan } from './plan-move';

export const MOVE_FAILED_MESSAGE =
  '카드를 옮기지 못했어요. 목록을 다시 불러왔습니다.';

/**
 * 카드 이동. 응답을 기다리지 않고 순서를 먼저 바꾸고(낙관적 업데이트), 실패하면 원위치로 되돌리고
 * 토스트로 알린 뒤 서버 상태로 목록을 다시 조회한다. 자동 재시도는 하지 않는다(서버가 이미 재시도함, D-68).
 */
export function useMoveTicket(filter: TicketFilter = EMPTY_FILTER) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  const toast = useToast();
  const listKey = ticketKeys.list(filter);

  const mutation = useMutation({
    mutationFn: (plan: MovePlan) =>
      unwrap(
        client.PUT('/v1/tickets/{ticketId}/position', {
          params: { path: { ticketId: plan.ticketId } },
          body: plan.request,
        }),
      ),
    onMutate: async (plan) => {
      await queryClient.cancelQueries({ queryKey: ticketKeys.all });
      const previous = queryClient.getQueryData<Ticket[]>(listKey);
      queryClient.setQueryData(listKey, flattenBoard(plan.board));
      return { previous };
    },
    onError: (_error, _plan, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
      toast.show(MOVE_FAILED_MESSAGE);
      void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onSuccess: (moved) => {
      queryClient.setQueryData<Ticket[]>(listKey, (list) =>
        list?.map((ticket) =>
          ticket.ticketId === moved.ticketId ? moved : ticket,
        ),
      );
    },
  });

  return {
    /** 실패는 훅 안에서 처리하므로 호출자는 결과를 기다릴 필요가 없다. */
    move: (plan: MovePlan): Promise<void> =>
      mutation.mutateAsync(plan).then(
        () => undefined,
        () => undefined,
      ),
  };
}
