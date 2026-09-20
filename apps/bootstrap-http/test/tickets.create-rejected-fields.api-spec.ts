import { startTestApp, type TestApp } from './helpers/app';
import { postTicket } from './helpers/http';

describe('POST /v1/tickets 서버 지정 값·범위 밖 필드 (US3)', () => {
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

  it.each(['ticketId', 'status', 'position', 'createdAt', 'updatedAt'])(
    'TC-API-022: V5 서버가 정하는 값(%s)을 보내면 무시하지 않고 400으로 거부한다',
    async (field) => {
      const response = await postTicket(t.baseUrl, {
        title: 't',
        [field]: 'x',
      });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.code).toBe('VALIDATION_FAILED');
      expect(json.details?.map((d) => d.field)).toContain(field);
      expect(await t.sql('select count(*) from ticket')).toBe('0');
    },
  );

  it.each([{ tags: ['a'] }, { tags: [] as string[] }])(
    'TC-API-023: V6 tags($tags)를 보내면 400으로 거부한다 (이 기능 한정 임시 규칙)',
    async ({ tags }) => {
      const response = await postTicket(t.baseUrl, { title: 't', tags });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.code).toBe('VALIDATION_FAILED');
      expect(json.details?.map((d) => d.field)).toContain('tags');
      expect(await t.sql('select count(*) from ticket')).toBe('0');
    },
  );

  it('TC-API-022: 서버 지정 값 여러 개를 함께 보내면 모두 details에 담는다', async () => {
    const json = await (
      await postTicket(t.baseUrl, { title: 't', ticketId: 'x', status: 'DONE' })
    ).json();

    expect(json.details?.map((d) => d.field).sort()).toEqual([
      'status',
      'ticketId',
    ]);
  });
});
