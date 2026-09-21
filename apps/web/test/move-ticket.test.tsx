import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { groupByStatus } from '@/entities/ticket/model/board';
import { useTicketsQuery } from '@/entities/ticket/api/queries';
import { useMoveTicket } from '@/features/move-ticket/model/use-move-ticket';
import { planMove } from '@/features/move-ticket/model/plan-move';
import { aTicket } from './helpers/tickets';
import { createFakeServer, errorResponse, gate } from './helpers/fake-server';
import { renderWithApp } from './helpers/render';

const PUT = /^\/v1\/tickets\/[^/]+\/position$/;
const LIST = /^\/v1\/tickets$/;

function Harness({ activeId, overId }: { activeId: string; overId: string }) {
  const { data } = useTicketsQuery();
  const { move } = useMoveTicket();
  return (
    <>
      <ol aria-label="목록">
        {data?.map((ticket) => (
          <li key={ticket.ticketId}>{`${ticket.status}:${ticket.ticketId}`}</li>
        ))}
      </ol>
      <button
        onClick={() => {
          const plan = planMove(groupByStatus(data ?? []), activeId, overId);
          if (plan) void move(plan);
        }}
      >
        이동
      </button>
    </>
  );
}

const order = () =>
  screen.getAllByRole('listitem').map((item) => item.textContent);
const start = () =>
  createFakeServer([
    aTicket('a', 'TODO'),
    aTicket('b', 'TODO'),
    aTicket('c', 'TODO'),
  ]);

describe('카드 이동 (UI-C11~C12)', () => {
  it('TC-UI-030: 응답을 기다리지 않고 배열 순서를 먼저 바꾸며, 성공하면 다시 조회하지 않는다', async () => {
    const user = userEvent.setup();
    const server = start();
    const held = gate();
    server.override('PUT', PUT, async (call) => {
      await held.opened;
      return Response.json(aTicket('a', 'TODO', { title: String(call.path) }));
    });
    renderWithApp(<Harness activeId="a" overId="c" />, server);
    await screen.findByText('TODO:a');

    await user.click(screen.getByRole('button', { name: '이동' }));

    await waitFor(() =>
      expect(order()).toEqual(['TODO:b', 'TODO:c', 'TODO:a']),
    );
    await act(async () => held.release());
    await waitFor(() => expect(server.callsTo('PUT', PUT)).toHaveLength(1));
    expect(server.callsTo('GET', LIST)).toHaveLength(1);
  });

  it('TC-UI-035: 이동 요청에는 기준 카드와 방향만 있고 position 값이 없다', async () => {
    const user = userEvent.setup();
    const server = start();
    renderWithApp(<Harness activeId="a" overId="c" />, server);
    await screen.findByText('TODO:a');

    await user.click(screen.getByRole('button', { name: '이동' }));

    await waitFor(() => expect(server.callsTo('PUT', PUT)).toHaveLength(1));
    expect(server.callsTo('PUT', PUT)[0]?.body).toEqual({
      status: 'TODO',
      anchorTicketId: 'c',
      placement: 'AFTER',
    });
  });

  describe('이동이 실패하면 (409)', () => {
    const failing = () => {
      const server = start();
      server.override('PUT', PUT, () =>
        errorResponse(409, 'POSITION_CONFLICT'),
      );
      return server;
    };

    it('TC-UI-031·032: 원위치로 되돌리고 서버 상태로 목록을 다시 조회한다', async () => {
      const user = userEvent.setup();
      const server = failing();
      renderWithApp(<Harness activeId="a" overId="c" />, server);
      await screen.findByText('TODO:a');

      await user.click(screen.getByRole('button', { name: '이동' }));

      await waitFor(() => expect(server.callsTo('GET', LIST)).toHaveLength(2));
      await waitFor(() =>
        expect(order()).toEqual(['TODO:a', 'TODO:b', 'TODO:c']),
      );
    });

    it('TC-UI-033: 토스트로 알린다', async () => {
      const user = userEvent.setup();
      renderWithApp(<Harness activeId="a" overId="c" />, failing());
      await screen.findByText('TODO:a');

      await user.click(screen.getByRole('button', { name: '이동' }));

      expect(await screen.findByRole('status')).toHaveTextContent(
        '카드를 옮기지 못했어요. 목록을 다시 불러왔습니다.',
      );
    });

    it('TC-UI-034: 자동으로 다시 시도하지 않는다', async () => {
      const user = userEvent.setup();
      const server = failing();
      renderWithApp(<Harness activeId="a" overId="c" />, server);
      await screen.findByText('TODO:a');

      await user.click(screen.getByRole('button', { name: '이동' }));

      await screen.findByRole('status');
      await waitFor(() => expect(server.callsTo('GET', LIST)).toHaveLength(2));
      expect(server.callsTo('PUT', PUT)).toHaveLength(1);
    });
  });
});
