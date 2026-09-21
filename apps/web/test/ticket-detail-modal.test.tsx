import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BoardView } from '@/views/board';
import { aTicket } from './helpers/tickets';
import { createFakeServer, errorResponse } from './helpers/fake-server';
import { renderWithApp } from './helpers/render';

const PATCH = /^\/v1\/tickets\/[^/]+$/;

const full = () =>
  aTicket('a', 'TODO', {
    title: '원래 제목',
    description: '원래 설명',
    priority: 'HIGH',
    dueAt: '2026-12-31T23:59:00.000Z',
  });

async function openModal(server = createFakeServer([full()])) {
  const user = userEvent.setup();
  renderWithApp(<BoardView />, server);
  await user.click(await screen.findByText('원래 제목'));
  const dialog = await screen.findByRole('dialog');
  return { user, server, dialog: within(dialog) };
}

describe('티켓 상세 모달 (UI-C08)', () => {
  it('TC-UI-013: 열면 카드의 현재 값이 채워진다', async () => {
    const { dialog } = await openModal();

    expect(dialog.getByLabelText('제목')).toHaveValue('원래 제목');
    expect(dialog.getByLabelText('설명')).toHaveValue('원래 설명');
    expect(dialog.getByLabelText('우선순위')).toHaveValue('HIGH');
    expect(dialog.getByLabelText('마감일')).toHaveValue('2026-12-31T23:59');
  });

  it('TC-UI-014·042: 저장을 누르기 전에는 요청하지 않고, 누르면 바뀐 필드만 보내 화면에 반영한다', async () => {
    const { user, server, dialog } = await openModal();

    const title = dialog.getByLabelText('제목');
    await user.clear(title);
    await user.type(title, '새 제목');
    await user.selectOptions(dialog.getByLabelText('우선순위'), 'LOW');
    expect(server.callsTo('PATCH', PATCH)).toHaveLength(0);

    await user.click(dialog.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(server.callsTo('PATCH', PATCH).map((c) => c.body)).toEqual([
      { title: '새 제목', priority: 'LOW' },
    ]);
    expect(await screen.findByText('새 제목')).toBeVisible();
  });

  it('TC-UI-015: 상태·순서를 편집하는 요소가 없고 수정 요청에도 담지 않는다', async () => {
    const { user, server, dialog } = await openModal();

    expect(dialog.queryByLabelText(/상태|순서/)).toBeNull();
    await user.type(dialog.getByLabelText('제목'), '!');
    await user.click(dialog.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(server.callsTo('PATCH', PATCH)).toHaveLength(1));
    const body = server.callsTo('PATCH', PATCH)[0]?.body as Record<
      string,
      unknown
    >;
    expect(Object.keys(body)).not.toContain('status');
    expect(Object.keys(body)).not.toContain('position');
  });

  it('TC-UI-016: 서버 VALIDATION_FAILED의 필드별 사유를 해당 필드에 표시한다', async () => {
    const server = createFakeServer([full()]);
    server.override('PATCH', PATCH, () =>
      errorResponse(400, 'VALIDATION_FAILED', [
        { field: 'title', reason: '제목은 비어 있을 수 없습니다.' },
      ]),
    );
    const { user, dialog } = await openModal(server);

    await user.type(dialog.getByLabelText('제목'), '!');
    await user.click(dialog.getByRole('button', { name: '저장' }));

    expect(
      await dialog.findByText('제목은 비어 있을 수 없습니다.'),
    ).toBeVisible();
    expect(dialog.getByLabelText('제목')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('TC-UI-044: 설명과 마감일을 비우면 null로 보낸다', async () => {
    const { user, server, dialog } = await openModal();

    await user.clear(dialog.getByLabelText('설명'));
    fireEvent.change(dialog.getByLabelText('마감일'), {
      target: { value: '' },
    });
    await user.click(dialog.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(server.callsTo('PATCH', PATCH)).toHaveLength(1));
    expect(server.callsTo('PATCH', PATCH)[0]?.body).toEqual({
      description: null,
      dueAt: null,
    });
  });

  it('TC-UI-041: 삭제는 확인 단계를 거치고, 취소하면 요청하지 않는다', async () => {
    const { user, server, dialog } = await openModal();

    await user.click(dialog.getByRole('button', { name: '삭제' }));
    expect(dialog.getByText('정말 삭제할까요?')).toBeVisible();
    await user.click(dialog.getByRole('button', { name: '취소' }));

    expect(server.callsTo('DELETE', PATCH)).toHaveLength(0);
    expect(dialog.queryByText('정말 삭제할까요?')).toBeNull();
  });

  it('TC-UI-041·046: 삭제를 확인하면 삭제 요청 뒤 모달이 닫히고 카드가 사라진다', async () => {
    const { user, server, dialog } = await openModal();

    await user.click(dialog.getByRole('button', { name: '삭제' }));
    await user.click(dialog.getByRole('button', { name: '삭제 확인' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(server.callsTo('DELETE', PATCH)).toHaveLength(1);
    await waitFor(() => expect(screen.queryByText('원래 제목')).toBeNull());
  });
});
