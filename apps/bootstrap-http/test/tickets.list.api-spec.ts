import { startTestApp, type TestApp } from './helpers/app';
import {
  getTicket,
  listTickets,
  postTicket,
  TICKET_RESPONSE_KEYS,
} from './helpers/http';

describe('GET /v1/tickets (002 US1)', () => {
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

  it('TC-API-028: 티켓이 없으면 200과 빈 배열이다', async () => {
    const response = await listTickets(t.baseUrl);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it('TC-API-029: 여러 건을 담고 각 항목은 단건 조회 표현과 같다', async () => {
    const a = await (await postTicket(t.baseUrl, { title: 'A' })).json();
    const b = await (
      await postTicket(t.baseUrl, { title: 'B', priority: 'HIGH' })
    ).json();

    const body = await (await listTickets(t.baseUrl)).json();

    expect(body).toHaveLength(2);
    expect(body[0]).toEqual(
      await (await getTicket(t.baseUrl, a.ticketId)).json(),
    );
    expect(body[1]).toEqual(
      await (await getTicket(t.baseUrl, b.ticketId)).json(),
    );
  });

  it('TC-API-030: 상태 순서이고 같은 상태 안에서는 컬럼 순서다', async () => {
    const titles = ['a', 'b', 'c', 'd', 'e'];
    for (const title of titles) {
      await postTicket(t.baseUrl, { title });
    }
    // 이동 API가 없으므로 DB를 직접 바꿔 상태를 섞는다(순서 키는 상태별로 유일하게 유지).
    await t.sql("UPDATE ticket SET status = 'DONE' WHERE title = 'a'");
    await t.sql("UPDATE ticket SET status = 'IN_PROGRESS' WHERE title = 'b'");
    await t.sql("UPDATE ticket SET status = 'DONE' WHERE title = 'c'");

    const body = await (await listTickets(t.baseUrl)).json();

    expect(body.map((ticket) => `${ticket.status}:${ticket.title}`)).toEqual([
      'TODO:d',
      'TODO:e',
      'IN_PROGRESS:b',
      'DONE:a',
      'DONE:c',
    ]);
  });

  it('TC-API-031: 응답에는 내부 PK와 position이 없고 정해진 필드만 있다', async () => {
    await postTicket(t.baseUrl, { title: 't' });

    const [ticket] = await (await listTickets(t.baseUrl)).json();

    expect(Object.keys(ticket).sort()).toEqual(TICKET_RESPONSE_KEYS);
  });
});
