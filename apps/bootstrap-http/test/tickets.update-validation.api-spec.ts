import { randomUUID } from 'node:crypto';
import { startTestApp, type TestApp } from './helpers/app';
import { getTicket, patchRaw, patchTicket, postTicket } from './helpers/http';

describe('PATCH /v1/tickets/{ticketId} 거부 (003 US2)', () => {
  let t: TestApp;
  let ticketId: string;

  beforeAll(async () => {
    t = await startTestApp();
  });
  afterAll(async () => {
    await t.stop();
  });
  beforeEach(async () => {
    await t.reset();
    ticketId = (
      await (
        await postTicket(t.baseUrl, {
          title: '원래 제목',
          description: '원래 설명',
          priority: 'HIGH',
        })
      ).json()
    ).ticketId;
  });

  it.each([
    ['빈 본문', {}],
    ['이름이 다른 미지 필드만', { unknown: 'x' }],
  ])('TC-API-044: %s은 400 VALIDATION_FAILED다', async (_label, body) => {
    const response = await patchTicket(t.baseUrl, ticketId, body);

    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('VALIDATION_FAILED');
  });

  it('TC-API-045: 서버가 정하는 값은 무시하지 않고 거부하며 모두 details에 담는다', async () => {
    const response = await patchTicket(t.baseUrl, ticketId, {
      title: '바뀜',
      ticketId: randomUUID(),
      status: 'DONE',
      position: 'a9',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe('VALIDATION_FAILED');
    expect(body.details?.map((d) => d.field).sort()).toEqual([
      'createdAt',
      'position',
      'status',
      'ticketId',
      'updatedAt',
    ]);
  });

  it.each([
    ['제목이 빈 값', { title: '' }, 'title'],
    ['제목이 null', { title: null }, 'title'],
    ['제목이 101자', { title: 'a'.repeat(101) }, 'title'],
    ['설명이 2001자', { description: 'a'.repeat(2001) }, 'description'],
    ['우선순위가 허용 값 밖', { priority: 'NORMAL' }, 'priority'],
    ['우선순위가 null', { priority: null }, 'priority'],
    ['dueAt이 ISO 8601이 아님', { dueAt: '내일' }, 'dueAt'],
    ['설명이 문자열이 아님', { description: 5 }, 'description'],
  ])(
    'TC-API-047: %s이면 400 VALIDATION_FAILED다',
    async (_label, body, field) => {
      const response = await patchTicket(t.baseUrl, ticketId, body);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.code).toBe('VALIDATION_FAILED');
      expect(json.details?.map((d) => d.field)).toContain(field);
    },
  );

  it('TC-API-048: 없는 티켓은 404 TICKET_NOT_FOUND다', async () => {
    const response = await patchTicket(t.baseUrl, randomUUID(), {
      title: '바뀜',
    });

    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe('TICKET_NOT_FOUND');
  });

  it('TC-API-049: UUID 형식이 아니면 400 INVALID_TICKET_ID다', async () => {
    const response = await patchTicket(t.baseUrl, 'not-a-uuid', {
      title: '바뀜',
    });

    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('INVALID_TICKET_ID');
  });

  it('TC-API-050: 올바르지 않은 JSON은 400, JSON이 아닌 Content-Type은 415다', async () => {
    const broken = await patchRaw(
      t.baseUrl,
      ticketId,
      '{"title": ',
      'application/json',
    );
    const plain = await patchRaw(t.baseUrl, ticketId, 'title', 'text/plain');

    expect(broken.status).toBe(400);
    expect((await broken.json()).code).toBe('INVALID_REQUEST_BODY');
    expect(plain.status).toBe(415);
    expect((await plain.json()).code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('TC-API-051: 검증에 실패한 수정은 저장된 값을 바꾸지 않는다', async () => {
    await patchTicket(t.baseUrl, ticketId, {
      title: '바뀜',
      priority: 'NORMAL',
    });
    await patchTicket(t.baseUrl, ticketId, {});

    const body = await (await getTicket(t.baseUrl, ticketId)).json();
    expect(body).toMatchObject({
      title: '원래 제목',
      description: '원래 설명',
      priority: 'HIGH',
    });
  });
});
