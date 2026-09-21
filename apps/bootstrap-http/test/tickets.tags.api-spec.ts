import { randomUUID } from 'node:crypto';
import { startTestApp, type TestApp } from './helpers/app';
import {
  deleteTicket,
  getTicket,
  listTickets,
  patchTicket,
  postSort,
  postTicket,
  putPosition,
  TICKET_RESPONSE_KEYS,
} from './helpers/http';

describe('태그 (007)', () => {
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
    (await postTicket(t.baseUrl, { title: 't', ...body })).json();

  it('TC-API-083: 생성 시 tags는 정규화·중복 제거·오름차순으로 돌아온다', async () => {
    const response = await postTicket(t.baseUrl, {
      title: 't',
      tags: [' Docs ', 'b', 'docs', 'A'],
    });

    expect(response.status).toBe(201);
    expect((await response.json()).tags).toEqual(['a', 'b', 'docs']);
  });

  it('TC-API-084: tags를 생략하면 빈 배열이다', async () => {
    expect((await create({})).tags).toEqual([]);
  });

  it('TC-API-085: 단건·목록 조회에도 tags가 있다', async () => {
    const a = await create({ tags: ['x', 'y'] });
    await create({});

    expect(
      (await (await getTicket(t.baseUrl, a.ticketId)).json()).tags,
    ).toEqual(['x', 'y']);
    expect(
      (await (await listTickets(t.baseUrl)).json()).map((x) => x.tags),
    ).toEqual([['x', 'y'], []]);
  });

  it('TC-API-086: 수정은 tags를 통째로 교체하고 [] 는 비우며 생략하면 유지한다', async () => {
    const a = await create({ tags: ['a', 'b'] });

    expect(
      (
        await (
          await patchTicket(t.baseUrl, a.ticketId, { tags: ['B', 'c'] })
        ).json()
      ).tags,
    ).toEqual(['b', 'c']);
    expect(
      (await (await patchTicket(t.baseUrl, a.ticketId, { title: '새' })).json())
        .tags,
    ).toEqual(['b', 'c']);
    expect(
      (await (await patchTicket(t.baseUrl, a.ticketId, { tags: [] })).json())
        .tags,
    ).toEqual([]);
  });

  it('TC-API-087: tags만 담은 수정도 200이다', async () => {
    const a = await create({});
    const response = await patchTicket(t.baseUrl, a.ticketId, { tags: ['x'] });
    expect(response.status).toBe(200);
  });

  it.each([
    ['배열이 아님', 'a'],
    ['문자열이 아닌 항목', [1]],
    ['빈 이름', ['  ']],
    ['31자', ['a'.repeat(31)]],
    ['11개', Array.from({ length: 11 }, (_, i) => `t${i}`)],
  ])(
    'TC-API-088: tags가 %s이면 생성·수정 모두 400 VALIDATION_FAILED다',
    async (_l, tags) => {
      const a = await create({});
      const created = await postTicket(t.baseUrl, { title: 'x', tags });
      const patched = await patchTicket(t.baseUrl, a.ticketId, { tags });

      for (const response of [created, patched]) {
        const json = await response.json();
        expect(response.status).toBe(400);
        expect(json.code).toBe('VALIDATION_FAILED');
        expect(json.details?.map((d) => d.field)).toContain('tags');
      }
    },
  );

  it('TC-API-089: tags가 null이면 400이다', async () => {
    const a = await create({});
    expect(
      (await postTicket(t.baseUrl, { title: 'x', tags: null })).status,
    ).toBe(400);
    expect(
      (await patchTicket(t.baseUrl, a.ticketId, { tags: null })).status,
    ).toBe(400);
  });

  it('TC-API-090: 응답은 tags를 포함한 정해진 필드뿐이다', async () => {
    const body = await create({ tags: ['a'] });
    expect(Object.keys(body).sort()).toEqual(TICKET_RESPONSE_KEYS);
  });

  it('TC-API-091: 이동·정렬·수정 뒤에도 태그가 유지된다', async () => {
    const a = await create({ tags: ['a'] });
    const b = await create({ tags: ['b'], priority: 'HIGH' });

    await putPosition(t.baseUrl, a.ticketId, {
      status: 'DONE',
      placement: 'AFTER',
    });
    await postSort(t.baseUrl, {
      status: 'TODO',
      sortBy: 'PRIORITY',
      direction: 'ASC',
    });
    await patchTicket(t.baseUrl, b.ticketId, { title: '바뀜' });

    const list = await (await listTickets(t.baseUrl)).json();
    expect(list.map((x) => [x.ticketId, x.tags])).toEqual([
      [b.ticketId, ['b']],
      [a.ticketId, ['a']],
    ]);
  });

  it('TC-API-092: 삭제 뒤 같은 태그로 새 티켓을 만들 수 있다', async () => {
    const a = await create({ tags: ['x'] });
    await deleteTicket(t.baseUrl, a.ticketId);

    const again = await postTicket(t.baseUrl, { title: 'n', tags: ['x'] });
    expect(again.status).toBe(201);
    expect((await deleteTicket(t.baseUrl, randomUUID())).status).toBe(404);
  });
});
