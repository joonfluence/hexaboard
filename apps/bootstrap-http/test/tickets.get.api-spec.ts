import { startTestApp, type TestApp } from './helpers/app';
import { getTicket, postTicket, TICKET_RESPONSE_KEYS } from './helpers/http';

describe('GET /v1/tickets/{ticketId} (US2)', () => {
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

  it('TC-API-014: G1 존재하는 ticketId를 조회하면 200과 생성 시 값이 돌아온다', async () => {
    const created = await (
      await postTicket(t.baseUrl, {
        title: '문서 정리',
        description: '상세 설명',
        priority: 'HIGH',
        dueAt: '2026-12-31T23:59:00.000Z',
      })
    ).json();

    const response = await getTicket(t.baseUrl, created.ticketId);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(created);
    expect(body).toMatchObject({
      title: '문서 정리',
      description: '상세 설명',
      status: 'TODO',
      priority: 'HIGH',
      dueAt: '2026-12-31T23:59:00.000Z',
    });
  });

  it('TC-API-015: G1 응답에는 내부 PK(id)와 position이 없다', async () => {
    const created = await (await postTicket(t.baseUrl, { title: 't' })).json();

    const body = await (await getTicket(t.baseUrl, created.ticketId)).json();

    expect(Object.keys(body).sort()).toEqual(TICKET_RESPONSE_KEYS);
  });

  it('TC-API-016: G2 UUID 형식이나 없는 티켓은 404 TICKET_NOT_FOUND다', async () => {
    const response = await getTicket(t.baseUrl, crypto.randomUUID());
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      statusCode: 404,
      code: 'TICKET_NOT_FOUND',
      message: expect.any(String),
    });
  });

  it.each(['not-a-uuid', '123', 'abc-def'])(
    'TC-API-017: G3 UUID 형식이 아닌 값(%s)은 400 INVALID_TICKET_ID다',
    async (ticketId) => {
      const response = await getTicket(t.baseUrl, ticketId);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toMatchObject({
        statusCode: 400,
        code: 'INVALID_TICKET_ID',
        message: expect.any(String),
      });
    },
  );
});
