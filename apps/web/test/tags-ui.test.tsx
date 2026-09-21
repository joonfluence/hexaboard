import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BoardView } from '@/views/board';
import { aTicket } from './helpers/tickets';
import { createFakeServer } from './helpers/fake-server';
import { renderWithApp } from './helpers/render';

const PATCH = /^\/v1\/tickets\/[^/]+$/;

describe('태그 UI (UI-C06, C08)', () => {
  it('TC-UI-007: 태그 배지는 태그가 있을 때만 카드에 표시한다', async () => {
    renderWithApp(
      <BoardView />,
      createFakeServer([
        aTicket('a', 'TODO', { tags: ['auth', 'docs'] }),
        aTicket('b', 'TODO'),
      ]),
    );

    const cardA = (await screen.findByText('제목 a')).closest('button')!;
    const cardB = screen.getByText('제목 b').closest('button')!;
    expect(within(cardA).getByText('auth')).toBeVisible();
    expect(within(cardA).getByText('docs')).toBeVisible();
    expect(within(cardB).queryByTestId('tag-badge')).toBeNull();
  });

  it('TC-UI-013·017·047: 모달에 현재 태그가 보이고, 추가·제거한 뒤 저장하면 tags 전체를 보내며 서버가 정규화한 이름으로 표시된다', async () => {
    const user = userEvent.setup();
    const server = createFakeServer([
      aTicket('a', 'TODO', { tags: ['auth', 'old'] }),
    ]);
    renderWithApp(<BoardView />, server);

    await user.click(await screen.findByText('제목 a'));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('auth')).toBeVisible();

    await user.click(dialog.getByRole('button', { name: 'old 제거' }));
    await user.type(dialog.getByLabelText('태그'), '  Docs ');
    await user.click(dialog.getByRole('button', { name: '태그 추가' }));
    expect(dialog.getByText('docs')).toBeVisible();
    expect(dialog.queryByText('old')).toBeNull();
    await user.click(dialog.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(server.callsTo('PATCH', PATCH).map((c) => c.body)).toEqual([
      { tags: ['auth', 'docs'] },
    ]);
    const card = (await screen.findByText('제목 a')).closest('button')!;
    expect(within(card).getByText('docs')).toBeVisible();
  });

  it('태그를 바꾸지 않으면 tags를 보내지 않는다', async () => {
    const user = userEvent.setup();
    const server = createFakeServer([aTicket('a', 'TODO', { tags: ['auth'] })]);
    renderWithApp(<BoardView />, server);

    await user.click(await screen.findByText('제목 a'));
    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText('제목'), '!');
    await user.click(dialog.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(server.callsTo('PATCH', PATCH)).toHaveLength(1));
    expect(
      Object.keys(server.callsTo('PATCH', PATCH)[0]!.body as object),
    ).toEqual(['title']);
  });
});
