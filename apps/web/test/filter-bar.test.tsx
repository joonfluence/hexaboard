import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BoardView } from '@/views/board';
import { aTicket } from './helpers/tickets';
import { createFakeServer, type FakeServer } from './helpers/fake-server';
import { renderWithApp } from './helpers/render';

const LIST = /^\/v1\/tickets$/;
const lastSearch = (server: FakeServer) =>
  new URLSearchParams(server.callsTo('GET', LIST).at(-1)!.search);

const seed = () =>
  createFakeServer([
    aTicket('a', 'TODO', {
      title: 'Fix login',
      priority: 'HIGH',
      tags: ['auth'],
    }),
    aTicket('b', 'TODO', {
      title: '문서',
      priority: 'LOW',
      tags: ['docs', 'auth'],
    }),
    aTicket('c', 'DONE', { title: 'Deploy', priority: 'HIGH', tags: ['ops'] }),
  ]);
const bar = () => within(screen.getByRole('search', { name: '필터' }));

describe('필터 바 (UI-C09)', () => {
  it('TC-UI-018: 검색어를 입력하면 q 쿼리로 조회해 결과만 표시한다', async () => {
    const user = userEvent.setup();
    const server = seed();
    renderWithApp(<BoardView />, server);
    await screen.findByText('Fix login');

    await user.type(bar().getByRole('searchbox', { name: '검색어' }), 'login');

    await waitFor(() => expect(lastSearch(server).get('q')).toBe('login'));
    await waitFor(() => expect(screen.queryByText('문서')).toBeNull());
    expect(screen.getByText('Fix login')).toBeVisible();
  });

  it('TC-UI-019: 우선순위를 고르면 priority 쿼리로 조회하고 여러 개면 반복해 보낸다', async () => {
    const user = userEvent.setup();
    const server = seed();
    renderWithApp(<BoardView />, server);
    await screen.findByText('Fix login');

    await user.click(bar().getByRole('checkbox', { name: '높음' }));
    await waitFor(() =>
      expect(lastSearch(server).getAll('priority')).toEqual(['HIGH']),
    );
    await waitFor(() => expect(screen.queryByText('문서')).toBeNull());

    await user.click(bar().getByRole('checkbox', { name: '낮음' }));
    await waitFor(() =>
      expect(lastSearch(server).getAll('priority').sort()).toEqual([
        'HIGH',
        'LOW',
      ]),
    );
    expect(await screen.findByText('문서')).toBeVisible();
  });

  it('TC-UI-020: 태그를 여러 개 고르면 tag를 반복해 보내고 하나라도 가진 티켓을 표시한다', async () => {
    const user = userEvent.setup();
    const server = seed();
    renderWithApp(<BoardView />, server);
    await screen.findByText('Fix login');

    await user.click(bar().getByRole('button', { name: 'docs' }));
    await user.click(bar().getByRole('button', { name: 'ops' }));

    await waitFor(() =>
      expect(lastSearch(server).getAll('tag').sort()).toEqual(['docs', 'ops']),
    );
    expect(await screen.findByText('문서')).toBeVisible();
    expect(screen.getByText('Deploy')).toBeVisible();
    expect(screen.queryByText('Fix login')).toBeNull();
  });

  it('TC-UI-021: 여러 종류의 조건을 함께 보낸다', async () => {
    const user = userEvent.setup();
    const server = seed();
    renderWithApp(<BoardView />, server);
    await screen.findByText('Fix login');

    await user.type(bar().getByRole('searchbox', { name: '검색어' }), 'fix');
    await user.click(bar().getByRole('checkbox', { name: '높음' }));
    await user.click(bar().getByRole('button', { name: 'auth' }));

    await waitFor(() => {
      const params = lastSearch(server);
      expect(params.get('q')).toBe('fix');
      expect(params.getAll('priority')).toEqual(['HIGH']);
      expect(params.getAll('tag')).toEqual(['auth']);
    });
  });

  it('TC-UI-022·048: 마감일 필터가 없고 태그 후보는 필터를 걸어도 줄지 않는다', async () => {
    const user = userEvent.setup();
    renderWithApp(<BoardView />, seed());
    await screen.findByText('Fix login');

    expect(bar().queryByLabelText(/마감/)).toBeNull();
    expect(
      bar().getAllByRole('button', { name: /^(auth|docs|ops)$/ }),
    ).toHaveLength(3);

    await user.click(bar().getByRole('button', { name: 'ops' }));
    await waitFor(() => expect(screen.queryByText('Fix login')).toBeNull());
    expect(
      bar().getAllByRole('button', { name: /^(auth|docs|ops)$/ }),
    ).toHaveLength(3);
  });

  it('TC-UI-049: 필터 해제를 누르면 모든 조건이 지워지고 전체 목록으로 돌아온다', async () => {
    const user = userEvent.setup();
    const server = seed();
    renderWithApp(<BoardView />, server);
    await screen.findByText('Fix login');
    await user.type(bar().getByRole('searchbox', { name: '검색어' }), 'login');
    await user.click(bar().getByRole('checkbox', { name: '높음' }));
    await user.click(bar().getByRole('button', { name: 'ops' }));

    await user.click(bar().getByRole('button', { name: '필터 해제' }));

    await waitFor(() => expect(lastSearch(server).toString()).toBe(''));
    expect(bar().getByRole('searchbox', { name: '검색어' })).toHaveValue('');
    expect(bar().getByRole('checkbox', { name: '높음' })).not.toBeChecked();
    expect(await screen.findByText('문서')).toBeVisible();
  });
});
