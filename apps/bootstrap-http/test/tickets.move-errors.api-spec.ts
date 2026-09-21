import { randomUUID } from 'node:crypto';
import { startTestApp, type TestApp } from './helpers/app';
import { postTicket, putPosition, putPositionRaw } from './helpers/http';

describe('PUT /v1/tickets/{ticketId}/position 거부 (004 US2)', () => {
  let t: TestApp;
  let a: string;
  let b: string;

  beforeAll(async () => {
    t = await startTestApp();
  });
  afterAll(async () => {
    await t.stop();
  });
  beforeEach(async () => {
    await t.reset();
    a = (await (await postTicket(t.baseUrl, { title: 'a' })).json()).ticketId;
    b = (await (await postTicket(t.baseUrl, { title: 'b' })).json()).ticketId;
  });

  it.each([
    ['status 없음', { placement: 'AFTER' }, 'status'],
    ['status가 허용 값 밖', { status: 'DOING', placement: 'AFTER' }, 'status'],
    ['placement 없음', { status: 'TODO' }, 'placement'],
    [
      'placement가 허용 값 밖',
      { status: 'TODO', placement: 'LEFT' },
      'placement',
    ],
    [
      'anchorTicketId가 UUID 아님',
      { status: 'TODO', placement: 'AFTER', anchorTicketId: 'x' },
      'anchorTicketId',
    ],
    ['본문이 객체가 아님', [], 'body'],
  ])(
    'TC-API-063: %s이면 400 VALIDATION_FAILED다',
    async (_label, body, field) => {
      const response = await putPosition(t.baseUrl, a, body);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.code).toBe('VALIDATION_FAILED');
      expect(json.details?.map((d) => d.field)).toContain(field);
    },
  );

  it('TC-API-064: 카드가 있는 컬럼에 기준을 생략하면 400 INVALID_POSITION_TARGET이다', async () => {
    const response = await putPosition(t.baseUrl, a, {
      status: 'TODO',
      placement: 'AFTER',
    });

    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('INVALID_POSITION_TARGET');
  });

  it('TC-API-065: 기준이 자기 자신이면 400 INVALID_POSITION_TARGET이다', async () => {
    const response = await putPosition(t.baseUrl, a, {
      status: 'TODO',
      anchorTicketId: a,
      placement: 'AFTER',
    });

    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('INVALID_POSITION_TARGET');
  });

  it('TC-API-066: 기준이 대상 상태 컬럼에 없으면 400 INVALID_POSITION_TARGET이다', async () => {
    const response = await putPosition(t.baseUrl, a, {
      status: 'DONE',
      anchorTicketId: b,
      placement: 'AFTER',
    });

    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('INVALID_POSITION_TARGET');
  });

  it('TC-API-067: 이동할 카드가 없으면 404 TICKET_NOT_FOUND, UUID 형식이 아니면 400 INVALID_TICKET_ID다', async () => {
    const missing = await putPosition(t.baseUrl, randomUUID(), {
      status: 'DONE',
      placement: 'AFTER',
    });
    const malformed = await putPosition(t.baseUrl, 'not-a-uuid', {
      status: 'DONE',
      placement: 'AFTER',
    });

    expect(missing.status).toBe(404);
    expect((await missing.json()).code).toBe('TICKET_NOT_FOUND');
    expect(malformed.status).toBe(400);
    expect((await malformed.json()).code).toBe('INVALID_TICKET_ID');
  });

  it('TC-API-068: 기준 카드가 없으면 404 ANCHOR_TICKET_NOT_FOUND다', async () => {
    const response = await putPosition(t.baseUrl, a, {
      status: 'TODO',
      anchorTicketId: randomUUID(),
      placement: 'AFTER',
    });

    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe('ANCHOR_TICKET_NOT_FOUND');
  });

  it('TC-API-070: 올바르지 않은 JSON은 400, JSON이 아닌 Content-Type은 415다', async () => {
    const broken = await putPositionRaw(
      t.baseUrl,
      a,
      '{"status": ',
      'application/json',
    );
    const plain = await putPositionRaw(t.baseUrl, a, 'x', 'text/plain');

    expect(broken.status).toBe(400);
    expect((await broken.json()).code).toBe('INVALID_REQUEST_BODY');
    expect(plain.status).toBe(415);
    expect((await plain.json()).code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });
});
