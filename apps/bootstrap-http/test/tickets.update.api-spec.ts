import { startTestApp, type TestApp } from './helpers/app';
import {
  getTicket,
  listTickets,
  patchTicket,
  postTicket,
  TICKET_RESPONSE_KEYS,
} from './helpers/http';

describe('PATCH /v1/tickets/{ticketId} 성공 (003 US1)', () => {
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

  const create = async (body: Record<string, unknown> = {}) =>
    (await postTicket(t.baseUrl, { title: '원래 제목', ...body })).json();

  it('TC-API-038: 제목만 수정하면 200이고 나머지는 그대로이며 단건 조회와 일치한다', async () => {
    const created = await create({
      description: '설명',
      priority: 'HIGH',
      dueAt: '2026-12-31T23:59:00.000Z',
    });

    const response = await patchTicket(t.baseUrl, created.ticketId, {
      title: '  새 제목  ',
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ticketId: created.ticketId,
      title: '새 제목',
      description: '설명',
      priority: 'HIGH',
      dueAt: '2026-12-31T23:59:00.000Z',
      status: 'TODO',
    });
    expect(await (await getTicket(t.baseUrl, created.ticketId)).json()).toEqual(
      body,
    );
  });

  it('TC-API-039: 여러 필드를 한 번에 수정한다', async () => {
    const created = await create();

    const body = await (
      await patchTicket(t.baseUrl, created.ticketId, {
        title: '새 제목',
        description: '새 설명',
        priority: 'URGENT',
        dueAt: '2027-01-01T09:00:00.000Z',
      })
    ).json();

    expect(body).toMatchObject({
      title: '새 제목',
      description: '새 설명',
      priority: 'URGENT',
      dueAt: '2027-01-01T09:00:00.000Z',
    });
  });

  it.each([
    ['null', null],
    ['빈 문자열', ''],
    ['공백뿐', '   '],
  ])(
    'TC-API-040: description이 %s이면 null로 저장한다',
    async (_label, description) => {
      const created = await create({ description: '설명' });

      const body = await (
        await patchTicket(t.baseUrl, created.ticketId, { description })
      ).json();

      expect(body.description).toBeNull();
    },
  );

  it('TC-API-041: dueAt을 null로 보내면 마감일이 해제된다', async () => {
    const created = await create({ dueAt: '2026-12-31T23:59:00.000Z' });

    const body = await (
      await patchTicket(t.baseUrl, created.ticketId, { dueAt: null })
    ).json();

    expect(body.dueAt).toBeNull();
  });

  it('TC-API-042: 응답은 정해진 8개 필드이고 createdAt은 불변, updatedAt은 갱신된다', async () => {
    const created = await create();

    const body = await (
      await patchTicket(t.baseUrl, created.ticketId, { title: '바뀜' })
    ).json();

    expect(Object.keys(body).sort()).toEqual(TICKET_RESPONSE_KEYS);
    expect(body.createdAt).toBe(created.createdAt);
    expect(Date.parse(body.updatedAt)).toBeGreaterThan(
      Date.parse(created.updatedAt),
    );
  });

  it('TC-API-043: 수정 뒤에도 상태와 컬럼 안 순서는 그대로다', async () => {
    const a = await create({ title: 'a' });
    const b = await create({ title: 'b' });
    await create({ title: 'c' });

    await patchTicket(t.baseUrl, b.ticketId, { title: 'b2', priority: 'LOW' });
    await patchTicket(t.baseUrl, a.ticketId, { title: 'a2' });

    const list = await (await listTickets(t.baseUrl)).json();
    expect(list.map((ticket) => `${ticket.status}:${ticket.title}`)).toEqual([
      'TODO:a2',
      'TODO:b2',
      'TODO:c',
    ]);
  });
});
