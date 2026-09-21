import { startTestApp, type TestApp } from './helpers/app';
import {
  listTickets,
  postSort,
  postSortRaw,
  postTicket,
  putPosition,
} from './helpers/http';

describe('POST /v1/tickets/sort (006)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await startTestApp();
  });
  afterAll(async () => {
    await t.stop();
  });
  beforeEach(async () => {
    await t.reset();
  });

  const create = async (title: string, extra: Record<string, unknown> = {}) =>
    (await postTicket(t.baseUrl, { title, ...extra })).json();
  const titles = async () =>
    (await (await listTickets(t.baseUrl)).json()).map(
      (x) => `${x.status}:${x.title}`,
    );

  const seed = async () => {
    await create('a', { priority: 'HIGH', dueAt: '2026-10-02T00:00:00.000Z' });
    await create('b', { priority: 'LOW' });
    await create('c', { priority: 'HIGH', dueAt: '2026-10-01T00:00:00.000Z' });
    await create('d', { priority: 'URGENT' });
  };

  it('TC-API-075: 우선순위 오름·내림 정렬이 목록에 반영된다', async () => {
    await seed();

    const asc = await postSort(t.baseUrl, {
      status: 'TODO',
      sortBy: 'PRIORITY',
      direction: 'ASC',
    });
    expect(asc.status).toBe(204);
    expect(await titles()).toEqual(['TODO:b', 'TODO:a', 'TODO:c', 'TODO:d']);

    await postSort(t.baseUrl, {
      status: 'TODO',
      sortBy: 'PRIORITY',
      direction: 'DESC',
    });
    expect(await titles()).toEqual(['TODO:d', 'TODO:a', 'TODO:c', 'TODO:b']);
  });

  it.each(['ASC', 'DESC'])(
    'TC-API-076: 마감일 %s 정렬에서 마감일 없는 카드는 맨 뒤다',
    async (direction) => {
      await seed();

      await postSort(t.baseUrl, {
        status: 'TODO',
        sortBy: 'DUE_AT',
        direction,
      });

      const order = await titles();
      expect(order.slice(2)).toEqual(['TODO:b', 'TODO:d']);
      expect(order.slice(0, 2)).toEqual(
        direction === 'ASC' ? ['TODO:c', 'TODO:a'] : ['TODO:a', 'TODO:c'],
      );
    },
  );

  it('TC-API-077: 다른 컬럼의 순서와 상태는 그대로다', async () => {
    await seed();
    const x = await create('x', { priority: 'URGENT' });
    const y = await create('y', { priority: 'LOW' });
    await putPosition(t.baseUrl, x.ticketId, {
      status: 'DONE',
      placement: 'AFTER',
    });
    await putPosition(t.baseUrl, y.ticketId, {
      status: 'DONE',
      anchorTicketId: x.ticketId,
      placement: 'AFTER',
    });

    await postSort(t.baseUrl, {
      status: 'TODO',
      sortBy: 'PRIORITY',
      direction: 'ASC',
    });

    expect((await titles()).filter((s) => s.startsWith('DONE'))).toEqual([
      'DONE:x',
      'DONE:y',
    ]);
  });

  it('TC-API-078: 정렬 뒤에도 새 티켓은 TODO 맨 뒤에 생성되고 이동이 정상 동작한다', async () => {
    await seed();
    await postSort(t.baseUrl, {
      status: 'TODO',
      sortBy: 'PRIORITY',
      direction: 'DESC',
    });

    const created = await create('z');
    const list = await (await listTickets(t.baseUrl)).json();
    const last = list[list.length - 1]!;
    const moved = await putPosition(t.baseUrl, created.ticketId, {
      status: 'TODO',
      anchorTicketId: list[0]!.ticketId,
      placement: 'BEFORE',
    });

    expect(last.title).toBe('z');
    expect(moved.status).toBe(200);
    expect((await titles())[0]).toBe('TODO:z');
  });

  it('TC-API-079: 빈 컬럼도 204다', async () => {
    const response = await postSort(t.baseUrl, {
      status: 'DONE',
      sortBy: 'PRIORITY',
      direction: 'ASC',
    });
    expect(response.status).toBe(204);
  });

  it.each([
    ['status 없음', { sortBy: 'PRIORITY', direction: 'ASC' }],
    ['status 허용 밖', { status: 'X', sortBy: 'PRIORITY', direction: 'ASC' }],
    ['sortBy 없음', { status: 'TODO', direction: 'ASC' }],
    ['sortBy 허용 밖', { status: 'TODO', sortBy: 'TITLE', direction: 'ASC' }],
    ['direction 없음', { status: 'TODO', sortBy: 'PRIORITY' }],
    [
      'direction 허용 밖',
      { status: 'TODO', sortBy: 'PRIORITY', direction: 'UP' },
    ],
  ])('TC-API-080: %s이면 400 VALIDATION_FAILED다', async (_l, body) => {
    const response = await postSort(t.baseUrl, body);
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('VALIDATION_FAILED');
  });

  it('TC-API-081: 올바르지 않은 JSON은 400, JSON이 아닌 Content-Type은 415다', async () => {
    const broken = await postSortRaw(
      t.baseUrl,
      '{"status": ',
      'application/json',
    );
    const plain = await postSortRaw(t.baseUrl, 'x', 'text/plain');
    expect(broken.status).toBe(400);
    expect((await broken.json()).code).toBe('INVALID_REQUEST_BODY');
    expect(plain.status).toBe(415);
  });

  it('TC-API-082: 정렬해도 제목 등 내용은 그대로다', async () => {
    const a = await create('a', { priority: 'HIGH', description: '설명' });
    await postSort(t.baseUrl, {
      status: 'TODO',
      sortBy: 'PRIORITY',
      direction: 'DESC',
    });
    const [after] = await (await listTickets(t.baseUrl)).json();
    expect(after).toMatchObject({
      ticketId: a.ticketId,
      title: 'a',
      description: '설명',
      priority: 'HIGH',
    });
  });
});
