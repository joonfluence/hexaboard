import { startTestApp, type TestApp } from './helpers/app';
import {
  postTicket,
  putPosition,
  TICKET_RESPONSE_KEYS,
  type TicketBody,
} from './helpers/http';

describe('GET /v1/tickets 검색·필터 (008)', () => {
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

  const create = async (body: Record<string, unknown>) =>
    (await postTicket(t.baseUrl, body)).json();
  const query = async (qs: string) => {
    const response = await fetch(`${t.baseUrl}/v1/tickets${qs}`);
    const json: unknown = await response.json();
    return {
      status: response.status,
      body: json as TicketBody[],
      error: json as TicketBody,
    };
  };
  const titles = async (qs: string) =>
    (await query(qs)).body.map((x) => x.title);

  const seed = async () => {
    await create({ title: 'Fix login', priority: 'HIGH', tags: ['auth'] });
    await create({
      title: '문서',
      description: '로그인 문서 LOGIN',
      priority: 'LOW',
      tags: ['docs', 'auth'],
    });
    const done = await create({
      title: 'Deploy',
      priority: 'HIGH',
      tags: ['ops'],
    });
    await putPosition(t.baseUrl, done.ticketId, {
      status: 'DONE',
      placement: 'AFTER',
    });
    await create({ title: 'Idle', priority: 'MEDIUM' });
  };

  it('TC-API-093: q는 제목·설명 부분 일치(대소문자 무시)이고 빈 q·공백 q는 무시한다', async () => {
    await seed();

    expect(await titles('?q=LoGiN')).toEqual(['Fix login', '문서']);
    expect(await titles('?q=%20%20')).toHaveLength(4);
    expect(await titles('?q=')).toHaveLength(4);
  });

  it('TC-API-094: priority·status는 단일 또는 반복이며 반복하면 OR이다', async () => {
    await seed();

    expect(await titles('?priority=HIGH')).toEqual(['Fix login', 'Deploy']);
    expect(await titles('?priority=HIGH&priority=LOW')).toEqual([
      'Fix login',
      '문서',
      'Deploy',
    ]);
    expect(await titles('?status=DONE')).toEqual(['Deploy']);
    expect(await titles('?status=DONE&status=TODO')).toHaveLength(4);
  });

  it('TC-API-095: tag는 하나라도 가진 티켓(OR)이고 대문자도 정규화해 비교한다', async () => {
    await seed();

    expect(await titles('?tag=docs')).toEqual(['문서']);
    expect(await titles('?tag=docs&tag=ops')).toEqual(['문서', 'Deploy']);
    expect(await titles('?tag=AUTH')).toEqual(['Fix login', '문서']);
  });

  it('TC-API-096: 여러 종류의 조건은 AND다', async () => {
    await seed();

    expect(await titles('?q=login&priority=HIGH')).toEqual(['Fix login']);
    expect(await titles('?tag=auth&priority=LOW&status=TODO')).toEqual([
      '문서',
    ]);
  });

  it('TC-API-097: 맞는 티켓이 없으면 200과 빈 배열이다', async () => {
    await seed();
    const response = await query('?q=없는말');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it.each([
    ['status', 'DOING'],
    ['priority', 'NORMAL'],
  ])(
    'TC-API-098: %s가 허용 값 밖(%s)이면 400 VALIDATION_FAILED다',
    async (name, value) => {
      const response = await query(`?${name}=${value}`);
      expect(response.status).toBe(400);
      expect(response.error.code).toBe('VALIDATION_FAILED');
      expect(response.error.details?.map((d) => d.field)).toContain(name);
    },
  );

  it('TC-API-099: 결과는 상태 순서·컬럼 순서이고 응답 필드는 목록과 같다', async () => {
    await seed();
    const { body } = await query('?priority=HIGH&priority=LOW&priority=MEDIUM');

    expect(body.map((x) => `${x.status}:${x.title}`)).toEqual([
      'TODO:Fix login',
      'TODO:문서',
      'TODO:Idle',
      'DONE:Deploy',
    ]);
    expect(Object.keys(body[0]).sort()).toEqual(TICKET_RESPONSE_KEYS);
  });

  it('TC-API-100: 정의되지 않은 쿼리 파라미터는 무시한다', async () => {
    await seed();
    expect(await titles('?foo=bar')).toHaveLength(4);
  });
});
