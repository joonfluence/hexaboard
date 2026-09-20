import { startTestApp, type TestApp } from './helpers/app';
import { postTicket, TICKET_RESPONSE_KEYS, UUID_V4 } from './helpers/http';

describe('POST /v1/tickets 생성 성공 (US1)', () => {
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

  it('C1: 제목만 주면 201, TODO, MEDIUM, 새 ticketId를 돌려준다', async () => {
    const response = await postTicket(t.baseUrl, { title: '문서 정리' });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ticketId).toMatch(UUID_V4);
    expect(body).toMatchObject({
      title: '문서 정리',
      description: null,
      status: 'TODO',
      priority: 'MEDIUM',
      dueAt: null,
    });
    expect(Date.parse(body.createdAt)).not.toBeNaN();
    expect(Date.parse(body.updatedAt)).not.toBeNaN();
  });

  it('C1: 응답에는 내부 PK(id)와 position, tags가 없다 (SC-003, D-80)', async () => {
    const body = await (await postTicket(t.baseUrl, { title: 't' })).json();
    expect(Object.keys(body).sort()).toEqual(TICKET_RESPONSE_KEYS);
  });

  it('C2: 제목·설명·우선순위·마감일을 모두 주면 그대로 저장한다', async () => {
    const response = await postTicket(t.baseUrl, {
      title: '문서 정리',
      description: '상세 설명',
      priority: 'HIGH',
      dueAt: '2026-12-31T23:59:00.000Z',
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      title: '문서 정리',
      description: '상세 설명',
      priority: 'HIGH',
      status: 'TODO',
      dueAt: '2026-12-31T23:59:00.000Z',
    });
  });

  it('C3: 제목 앞뒤 공백은 제거해 저장한다', async () => {
    const body = await (
      await postTicket(t.baseUrl, { title: '  문서 정리  ' })
    ).json();
    expect(body.title).toBe('문서 정리');
    expect(await t.sql('select title from ticket')).toBe('문서 정리');
  });

  it.each(['', '   '])(
    'C4: 설명이 %j이면 null로 저장한다',
    async (description) => {
      const body = await (
        await postTicket(t.baseUrl, { title: 't', description })
      ).json();
      expect(body.description).toBeNull();
      expect(await t.sql('select description is null from ticket')).toBe('t');
    },
  );

  it('C5: 제목 정확히 100자, 설명 정확히 2000자는 허용한다', async () => {
    const response = await postTicket(t.baseUrl, {
      title: '가'.repeat(100),
      description: '나'.repeat(2000),
    });
    expect(response.status).toBe(201);
  });

  it('C6: 같은 내용을 두 번 보내면 서로 다른 ticketId의 티켓 두 건이 만들어진다', async () => {
    const first = await (
      await postTicket(t.baseUrl, { title: '같은 내용' })
    ).json();
    const second = await (
      await postTicket(t.baseUrl, { title: '같은 내용' })
    ).json();

    expect(first.ticketId).not.toBe(second.ticketId);
    expect(await t.sql('select count(*) from ticket')).toBe('2');
  });

  it('C7: 이름이 다른 미지 필드는 무시하고 생성한다 (D-81)', async () => {
    const response = await postTicket(t.baseUrl, {
      title: 't',
      unknownField: 'ignored',
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).not.toHaveProperty('unknownField');
  });
});
