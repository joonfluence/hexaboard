import { randomUUID } from 'node:crypto';
import { startTestApp, type TestApp } from './helpers/app';
import {
  deleteTicket,
  getTicket,
  listTickets,
  postTicket,
} from './helpers/http';

describe('DELETE /v1/tickets/{ticketId} (002 US2)', () => {
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

  const create = async (title: string) =>
    (await postTicket(t.baseUrl, { title })).json();

  it('TC-API-032: 존재하는 티켓을 삭제하면 204이고 본문이 없다', async () => {
    const { ticketId } = await create('삭제 대상');

    const response = await deleteTicket(t.baseUrl, ticketId);

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
  });

  it('TC-API-033: 삭제 뒤 단건 조회는 404이고 목록에서 사라진다', async () => {
    const { ticketId } = await create('삭제 대상');
    await deleteTicket(t.baseUrl, ticketId);

    expect((await getTicket(t.baseUrl, ticketId)).status).toBe(404);
    expect(await (await listTickets(t.baseUrl)).json()).toEqual([]);
  });

  it('TC-API-034: 같은 컬럼의 다른 티켓과 순서는 그대로다', async () => {
    const a = await create('a');
    const b = await create('b');
    const c = await create('c');
    const positionsBefore = await t.sql(
      "SELECT string_agg(position, ',' ORDER BY position) FROM ticket WHERE title <> 'b'",
    );

    await deleteTicket(t.baseUrl, b.ticketId);

    const body = await (await listTickets(t.baseUrl)).json();
    expect(body.map((ticket) => ticket.ticketId)).toEqual([
      a.ticketId,
      c.ticketId,
    ]);
    expect(
      await t.sql(
        "SELECT string_agg(position, ',' ORDER BY position) FROM ticket",
      ),
    ).toBe(positionsBefore);
  });

  it.each([
    ['없는 티켓', randomUUID()],
    ['이미 삭제된 티켓', ''],
  ])('TC-API-035: %s은 404 TICKET_NOT_FOUND다', async (label, id) => {
    let target = id;
    if (label === '이미 삭제된 티켓') {
      target = (await create('한 번 삭제')).ticketId;
      await deleteTicket(t.baseUrl, target);
    }

    const response = await deleteTicket(t.baseUrl, target);

    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe('TICKET_NOT_FOUND');
  });

  it('TC-API-036: UUID 형식이 아니면 400 INVALID_TICKET_ID다', async () => {
    const response = await deleteTicket(t.baseUrl, 'not-a-uuid');

    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('INVALID_TICKET_ID');
  });

  it('TC-API-037: 삭제 뒤 새 티켓은 TODO 맨 뒤에 생성된다', async () => {
    await create('a');
    const b = await create('b');
    await deleteTicket(t.baseUrl, b.ticketId);

    const response = await postTicket(t.baseUrl, { title: 'c' });
    const body = await (await listTickets(t.baseUrl)).json();

    expect(response.status).toBe(201);
    expect(body.map((ticket) => ticket.title)).toEqual(['a', 'c']);
  });
});
