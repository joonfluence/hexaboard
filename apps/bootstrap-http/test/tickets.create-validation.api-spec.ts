import { startTestApp, type TestApp } from './helpers/app';
import { postTicket } from './helpers/http';

describe('POST /v1/tickets 검증 실패 (US3)', () => {
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

  const expectValidationFailed = async (body: unknown, field: string) => {
    const response = await postTicket(t.baseUrl, body);
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.code).toBe('VALIDATION_FAILED');
    expect(json.details?.map((d) => d.field)).toContain(field);
    return json;
  };

  it.each([
    ['제목 없음', {}],
    ['제목 null', { title: null }],
    ['제목 빈 문자열', { title: '' }],
    ['제목 공백뿐', { title: '   ' }],
    ['제목이 숫자', { title: 123 }],
    ['본문이 배열', []],
  ])('TC-API-018: V1 %s → 400 VALIDATION_FAILED', async (_name, body) => {
    await expectValidationFailed(
      body,
      body instanceof Array ? 'body' : 'title',
    );
  });

  it('TC-API-019: V2 제목 101자 → 400 VALIDATION_FAILED', async () => {
    await expectValidationFailed({ title: '가'.repeat(101) }, 'title');
  });

  it('TC-API-019: V2 설명 2001자 → 400 VALIDATION_FAILED', async () => {
    await expectValidationFailed(
      { title: 't', description: '나'.repeat(2001) },
      'description',
    );
  });

  it.each(['CRITICAL', 'low', null, 3])(
    'TC-API-020: V3 우선순위 %j → 400 VALIDATION_FAILED',
    async (priority) => {
      await expectValidationFailed({ title: 't', priority }, 'priority');
    },
  );

  it.each(['tomorrow', '2026-13-45T00:00:00Z', 12345])(
    'TC-API-021: V4 dueAt %j → 400 VALIDATION_FAILED',
    async (dueAt) => {
      await expectValidationFailed({ title: 't', dueAt }, 'dueAt');
    },
  );

  it('TC-API-026: 검증 실패 응답은 statusCode·code·message와 필드별 details를 담는다', async () => {
    const json = await expectValidationFailed({ title: '' }, 'title');

    expect(json.statusCode).toBe(400);
    expect(json.message).toEqual(expect.any(String));
    expect(json.details).toEqual([
      { field: 'title', reason: expect.any(String) },
    ]);
  });

  it('TC-API-027: 검증에 실패한 요청으로는 티켓이 저장되지 않는다', async () => {
    for (const body of [
      {},
      { title: '' },
      { title: 't', priority: 'CRITICAL' },
      { title: 't', dueAt: 'tomorrow' },
      { title: '가'.repeat(101) },
    ]) {
      await postTicket(t.baseUrl, body);
    }

    expect(await t.sql('select count(*) from ticket')).toBe('0');
  });
});
