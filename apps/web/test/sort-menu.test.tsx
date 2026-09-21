import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BoardView } from '@/views/board';
import { aTicket } from './helpers/tickets';
import { createFakeServer } from './helpers/fake-server';
import { renderWithApp } from './helpers/render';

const SORT = /^\/v1\/tickets\/sort$/;
const LIST = /^\/v1\/tickets$/;
const column = (name: string) => within(screen.getByRole('region', { name }));
const seed = () =>
  createFakeServer([
    aTicket('a', 'TODO', { priority: 'LOW' }),
    aTicket('b', 'TODO', { priority: 'URGENT' }),
    aTicket('c', 'TODO', { priority: 'HIGH' }),
  ]);

describe('컬럼 정렬 메뉴 (UI-C10)', () => {
  it('TC-UI-023: 각 컬럼 헤더에 정렬 메뉴가 있다', async () => {
    renderWithApp(<BoardView />, seed());
    await screen.findByText('제목 a');

    for (const name of ['할 일', '진행 중', '완료']) {
      expect(column(name).getByRole('button', { name: '정렬' })).toBeVisible();
    }
  });

  it('TC-UI-024: 기준·방향을 골라 실행하면 그 컬럼의 상태·기준·방향으로 정렬 요청 뒤 다시 조회한다', async () => {
    const user = userEvent.setup();
    const server = seed();
    renderWithApp(<BoardView />, server);
    await screen.findByText('제목 a');
    const before = server.callsTo('GET', LIST).length;

    await user.click(column('할 일').getByRole('button', { name: '정렬' }));
    await user.selectOptions(
      column('할 일').getByLabelText('정렬 기준'),
      'PRIORITY',
    );
    await user.selectOptions(
      column('할 일').getByLabelText('정렬 방향'),
      'DESC',
    );
    await user.click(column('할 일').getByRole('button', { name: '실행' }));

    await waitFor(() =>
      expect(server.callsTo('POST', SORT).map((c) => c.body)).toEqual([
        { status: 'TODO', sortBy: 'PRIORITY', direction: 'DESC' },
      ]),
    );
    await waitFor(() =>
      expect(server.callsTo('GET', LIST).length).toBeGreaterThan(before),
    );
    const titles = column('할 일')
      .getAllByRole('button', { name: /제목/ })
      .map((b) => b.textContent);
    expect(titles[0]).toContain('제목 b');
    expect(titles[1]).toContain('제목 c');
  });

  it('TC-UI-025: 필터가 적용된 동안에는 정렬 메뉴가 비활성이다', async () => {
    const user = userEvent.setup();
    renderWithApp(<BoardView />, seed());
    await screen.findByText('제목 a');

    await user.click(
      within(screen.getByRole('search', { name: '필터' })).getByRole(
        'checkbox',
        { name: '높음' },
      ),
    );

    await waitFor(() =>
      expect(
        column('할 일').getByRole('button', { name: '정렬' }),
      ).toBeDisabled(),
    );
  });

  it('TC-UI-026: 정렬 메뉴에 실행 취소 요소가 없다', async () => {
    const user = userEvent.setup();
    renderWithApp(<BoardView />, seed());
    await screen.findByText('제목 a');

    await user.click(column('할 일').getByRole('button', { name: '정렬' }));

    expect(
      column('할 일').queryByRole('button', { name: /취소|되돌리/ }),
    ).toBeNull();
    expect(column('할 일').getByRole('button', { name: '실행' })).toBeVisible();
  });
});
