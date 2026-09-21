import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BoardView } from '@/views/board';
import { aTicket } from './helpers/tickets';
import { createFakeServer, errorResponse } from './helpers/fake-server';
import { renderWithApp } from './helpers/render';

const POST = /^\/v1\/tickets$/;
const todo = () => within(screen.getByRole('region', { name: '할 일' }));

describe('인라인 티켓 생성 (UI-C07)', () => {
  it('TC-UI-009: 제목만 입력해 제출하면 제목만 담아 생성 요청을 보낸다', async () => {
    const user = userEvent.setup();
    const server = createFakeServer();
    renderWithApp(<BoardView />, server);

    await user.type(
      await screen.findByLabelText('새 티켓 제목'),
      '  새 티켓  ',
    );
    await user.click(screen.getByRole('button', { name: '추가' }));

    await screen.findByText('새 티켓');
    expect(server.callsTo('POST', POST).map((c) => c.body)).toEqual([
      { title: '새 티켓' },
    ]);
  });

  it.each([
    ['빈 제목', ''],
    ['공백뿐인 제목', '   '],
  ])('TC-UI-010: %s은 요청을 보내지 않는다', async (_label, text) => {
    const user = userEvent.setup();
    const server = createFakeServer();
    renderWithApp(<BoardView />, server);

    const input = await screen.findByLabelText('새 티켓 제목');
    if (text) await user.type(input, text);
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(server.callsTo('POST', POST)).toHaveLength(0);
  });

  it('TC-UI-011·045: 성공하면 새 카드가 할 일 컬럼 맨 뒤에 나타나고 입력창이 비워진다', async () => {
    const user = userEvent.setup();
    const server = createFakeServer([
      aTicket('a', 'TODO'),
      aTicket('b', 'TODO'),
    ]);
    renderWithApp(<BoardView />, server);

    const input = await screen.findByLabelText('새 티켓 제목');
    await user.type(input, '새 카드');
    await user.click(screen.getByRole('button', { name: '추가' }));

    await todo().findByText('새 카드');
    const titles = todo()
      .getAllByRole('button', { name: /제목|새 카드/ })
      .map((card) => card.textContent ?? '');
    expect(titles[0]).toContain('제목 a');
    expect(titles[1]).toContain('제목 b');
    expect(titles[2]).toContain('새 카드');
    expect(input).toHaveValue('');
  });

  it('TC-UI-012: 서버가 VALIDATION_FAILED를 주면 code로 분기해 사유를 알린다', async () => {
    const user = userEvent.setup();
    const server = createFakeServer();
    server.override('POST', POST, () =>
      errorResponse(400, 'VALIDATION_FAILED', [
        { field: 'title', reason: '제목은 100자 이하여야 합니다.' },
      ]),
    );
    renderWithApp(<BoardView />, server);

    await user.type(await screen.findByLabelText('새 티켓 제목'), '제목');
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '제목은 100자 이하여야 합니다.',
    );
  });
});
