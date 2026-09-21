import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BoardView } from '@/views/board';
import { aTicket } from './helpers/tickets';
import { createFakeServer, errorResponse, gate } from './helpers/fake-server';
import { renderWithApp } from './helpers/render';

const column = (name: string) => screen.getByRole('region', { name });

describe('보드 화면 (UI-C01~C05)', () => {
  it('TC-UI-001: 세 개의 컬럼만 표시한다', async () => {
    renderWithApp(<BoardView />, createFakeServer());

    expect(await screen.findByRole('region', { name: '할 일' })).toBeVisible();
    expect(
      screen.getAllByRole('region').map((r) => r.getAttribute('aria-label')),
    ).toEqual(['할 일', '진행 중', '완료']);
  });

  it('TC-UI-002·003: 각 티켓이 자기 상태의 컬럼에 서버가 준 순서대로 표시된다', async () => {
    const server = createFakeServer([
      aTicket('a', 'TODO'),
      aTicket('x', 'DONE'),
      aTicket('b', 'TODO'),
      aTicket('m', 'IN_PROGRESS'),
    ]);
    renderWithApp(<BoardView />, server);

    await screen.findByText('제목 a');
    const todo = within(column('할 일')).getAllByRole('button', {
      name: /제목/,
    });
    expect(todo.map((c) => c.textContent)).toEqual([
      expect.stringContaining('제목 a'),
      expect.stringContaining('제목 b'),
    ]);
    expect(within(column('진행 중')).getByText('제목 m')).toBeVisible();
    expect(within(column('완료')).getByText('제목 x')).toBeVisible();
  });

  it('TC-UI-004·005: 카드는 제목과 우선순위 배지를 항상 보여 준다', async () => {
    renderWithApp(
      <BoardView />,
      createFakeServer([
        aTicket('a', 'TODO', { priority: 'URGENT' }),
        aTicket('b', 'TODO', { priority: 'LOW' }),
      ]),
    );

    const cardA = (await screen.findByText('제목 a')).closest('button')!;
    const cardB = screen.getByText('제목 b').closest('button')!;
    expect(within(cardA).getByText('긴급')).toBeVisible();
    expect(within(cardB).getByText('낮음')).toBeVisible();
  });

  it('TC-UI-006: 마감일 배지는 마감일이 있을 때만 표시한다', async () => {
    renderWithApp(
      <BoardView />,
      createFakeServer([
        aTicket('a', 'TODO', { dueAt: '2099-12-31T23:59:00.000Z' }),
        aTicket('b', 'TODO'),
      ]),
    );

    const cardA = (await screen.findByText('제목 a')).closest('button')!;
    const cardB = screen.getByText('제목 b').closest('button')!;
    expect(within(cardA).getByText('12월 31일 23:59')).toBeVisible();
    expect(within(cardB).queryByText(/월 .*일/)).toBeNull();
  });

  it('TC-UI-008: 카드를 클릭하면 상세 모달이 열린다', async () => {
    const user = userEvent.setup();
    renderWithApp(<BoardView />, createFakeServer([aTicket('a', 'TODO')]));

    await user.click(await screen.findByText('제목 a'));

    expect(await screen.findByRole('dialog')).toBeVisible();
  });

  it('TC-UI-036: 목록을 받는 동안 불러오는 중을 표시한다', async () => {
    const server = createFakeServer([aTicket('a', 'TODO')]);
    const held = gate();
    server.override('GET', /^\/v1\/tickets$/, async () => {
      await held.opened;
      return Response.json(server.tickets);
    });
    renderWithApp(<BoardView />, server);

    expect(screen.getByText('불러오는 중')).toBeVisible();
    held.release();
    expect(await screen.findByText('제목 a')).toBeVisible();
    expect(screen.queryByText('불러오는 중')).toBeNull();
  });

  it('TC-UI-037: 조회에 실패하면 오류 문구와 다시 시도 버튼을 보여 주고 누르면 다시 조회한다', async () => {
    const user = userEvent.setup();
    const server = createFakeServer([aTicket('a', 'TODO')]);
    let failing = true;
    server.override('GET', /^\/v1\/tickets$/, () =>
      failing
        ? errorResponse(500, 'INTERNAL_SERVER_ERROR')
        : Response.json(server.tickets),
    );
    renderWithApp(<BoardView />, server);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '불러오지 못했습니다',
    );
    failing = false;
    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('제목 a')).toBeVisible();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('TC-UI-038: 카드가 없는 컬럼에는 카드 없음을 표시한다', async () => {
    renderWithApp(<BoardView />, createFakeServer([aTicket('a', 'TODO')]));

    await screen.findByText('제목 a');
    expect(within(column('진행 중')).getByText('카드 없음')).toBeVisible();
    expect(within(column('완료')).getByText('카드 없음')).toBeVisible();
    expect(within(column('할 일')).queryByText('카드 없음')).toBeNull();
  });
});
