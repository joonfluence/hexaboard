import {
  PositionConflictError,
  type TicketRepository,
} from '@todo/application';
import { Ticket } from '@todo/domain';
import { startTestApp, type TestApp } from './helpers/app';
import { postTicket } from './helpers/http';

/** 처음 `conflicts`번의 저장에서 순서 충돌을 일으키는 저장소 대역. */
function conflictingRepository(conflicts: number) {
  const calls = { save: 0, findLastPosition: 0 };
  const repository: TicketRepository = {
    async save(ticket) {
      calls.save += 1;
      if (calls.save <= conflicts) {
        throw new PositionConflictError();
      }
      return Ticket.rehydrate({
        ticketId: ticket.ticketId,
        title: ticket.title.value,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority.value,
        dueAt: ticket.dueAt,
        position: ticket.position.value,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },
    async findByTicketId() {
      return null;
    },
    async findLastPosition() {
      calls.findLastPosition += 1;
      return null;
    },
    async findByStatus() {
      return [];
    },
    async reorder() {
      return;
    },
    async findAll() {
      return [];
    },
    async update() {
      return null;
    },
    async deleteByTicketId() {
      return false;
    },
    async findAdjacentPosition() {
      return null;
    },
    async hasTicketsInStatus() {
      return false;
    },
    async move() {
      return null;
    },
  };
  return { repository, calls };
}

// 최초 시도 후 최대 3번 재시도한다(D-69, D-84): 총 4번 시도.
const MAX_ATTEMPTS = 4;

describe('POST /v1/tickets 순서 충돌 (FR-013, D-84)', () => {
  let t: TestApp | undefined;

  afterEach(async () => {
    await t?.stop();
    t = undefined;
  });

  it('V9: 재시도 후에도 충돌하면 409 POSITION_CONFLICT를 돌려준다', async () => {
    const { repository, calls } = conflictingRepository(Infinity);
    t = await startTestApp({ repository });

    const response = await postTicket(t.baseUrl, { title: 't' });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toMatchObject({
      statusCode: 409,
      code: 'POSITION_CONFLICT',
      message: expect.any(String),
    });
    expect(calls.save).toBe(MAX_ATTEMPTS);
  });

  it.each([1, 2, 3])(
    '재시도 안에 해소되면(%i번 충돌) 정상 생성으로 응답한다',
    async (conflicts) => {
      const { repository, calls } = conflictingRepository(conflicts);
      t = await startTestApp({ repository });

      const response = await postTicket(t.baseUrl, { title: 't' });

      expect(response.status).toBe(201);
      expect(calls.save).toBe(conflicts + 1);
    },
  );

  it('시도할 때마다 마지막 순서 키를 다시 읽는다', async () => {
    const { repository, calls } = conflictingRepository(2);
    t = await startTestApp({ repository });

    await postTicket(t.baseUrl, { title: 't' });

    expect(calls.findLastPosition).toBe(3);
  });
});
