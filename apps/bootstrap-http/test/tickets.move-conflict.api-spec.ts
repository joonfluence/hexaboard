import {
  PositionConflictError,
  type TicketRepository,
} from '@todo/application';
import { Ticket } from '@todo/domain';
import { startTestApp, type TestApp } from './helpers/app';
import { putPosition } from './helpers/http';

const at = (title: string, key: string) =>
  Ticket.rehydrate({
    ticketId: crypto.randomUUID(),
    title,
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    dueAt: null,
    position: key,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

/** 처음 `conflicts`번의 이동 저장에서 순서 충돌을 일으키는 저장소 대역. */
function conflictingRepository(conflicts: number) {
  const mover = at('mover', 'a0');
  const anchor = at('anchor', 'a1');
  const calls = { move: 0, adjacent: 0 };
  const repository: TicketRepository = {
    async save(ticket) {
      return ticket;
    },
    async findByTicketId(ticketId) {
      return (
        [mover, anchor].find((ticket) => ticket.ticketId === ticketId) ?? null
      );
    },
    async findLastPosition() {
      return null;
    },
    async findByStatus() {
      return [];
    },
    async reorder() {
      return;
    },
    async findAll() {
      return [mover, anchor];
    },
    async update() {
      return null;
    },
    async deleteByTicketId() {
      return false;
    },
    async findAdjacentPosition() {
      calls.adjacent += 1;
      return null;
    },
    async hasTicketsInStatus() {
      return true;
    },
    async move(ticketId, status, position) {
      calls.move += 1;
      if (calls.move <= conflicts) {
        throw new PositionConflictError();
      }
      return mover.moveTo(status, position);
    },
  };
  return { repository, calls, mover, anchor };
}

// 최초 시도 후 최대 3번 재시도한다(D-69): 총 4번 시도.
const MAX_ATTEMPTS = 4;

describe('PUT /v1/tickets/{ticketId}/position 순서 충돌 (D-69, D-95)', () => {
  let t: TestApp | undefined;

  afterEach(async () => {
    await t?.stop();
    t = undefined;
  });

  it('TC-API-069: 재시도 후에도 충돌하면 409 POSITION_CONFLICT를 돌려준다', async () => {
    const { repository, calls, mover, anchor } =
      conflictingRepository(Infinity);
    t = await startTestApp({ repository });

    const response = await putPosition(t.baseUrl, mover.ticketId, {
      status: 'TODO',
      anchorTicketId: anchor.ticketId,
      placement: 'AFTER',
    });

    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe('POSITION_CONFLICT');
    expect(calls.move).toBe(MAX_ATTEMPTS);
  });

  it.each([1, 2, 3])(
    'TC-API-069: 재시도 안에 해소되면(%i번 충돌) 200이고 시도마다 이웃을 다시 읽는다',
    async (conflicts) => {
      const { repository, calls, mover, anchor } =
        conflictingRepository(conflicts);
      t = await startTestApp({ repository });

      const response = await putPosition(t.baseUrl, mover.ticketId, {
        status: 'TODO',
        anchorTicketId: anchor.ticketId,
        placement: 'AFTER',
      });

      expect(response.status).toBe(200);
      expect(calls.move).toBe(conflicts + 1);
      expect(calls.adjacent).toBe(conflicts + 1);
    },
  );
});
