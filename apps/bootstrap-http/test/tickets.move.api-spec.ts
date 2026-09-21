import { startTestApp, type TestApp } from './helpers/app';
import {
  getTicket,
  listTickets,
  postTicket,
  putPosition,
  TICKET_RESPONSE_KEYS,
} from './helpers/http';

describe('PUT /v1/tickets/{ticketId}/position 이동 (004 US1)', () => {
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

  const create = async (title: string) =>
    (await postTicket(t.baseUrl, { title })).json();

  /** 컬럼별 제목 순서. */
  const board = async () => {
    const list = await (await listTickets(t.baseUrl)).json();
    const columns: Record<string, string[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    };
    for (const ticket of list) {
      columns[ticket.status]!.push(ticket.title);
    }
    return columns;
  };

  it('TC-API-052: 빈 컬럼으로 옮기면(기준 생략) 상태가 바뀌고 그 컬럼의 첫 카드가 된다', async () => {
    const a = await create('a');
    await create('b');

    const response = await putPosition(t.baseUrl, a.ticketId, {
      status: 'IN_PROGRESS',
      placement: 'AFTER',
    });

    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe('IN_PROGRESS');
    expect(await board()).toEqual({
      TODO: ['b'],
      IN_PROGRESS: ['a'],
      DONE: [],
    });
  });

  it('TC-API-053: 같은 컬럼에서 기준 카드 뒤로 옮긴다', async () => {
    const a = await create('a');
    await create('b');
    const c = await create('c');

    await putPosition(t.baseUrl, a.ticketId, {
      status: 'TODO',
      anchorTicketId: c.ticketId,
      placement: 'AFTER',
    });

    expect((await board()).TODO).toEqual(['b', 'c', 'a']);
  });

  it('TC-API-054: 같은 컬럼에서 기준 카드 앞으로 옮긴다', async () => {
    const a = await create('a');
    await create('b');
    const c = await create('c');

    await putPosition(t.baseUrl, c.ticketId, {
      status: 'TODO',
      anchorTicketId: a.ticketId,
      placement: 'BEFORE',
    });

    expect((await board()).TODO).toEqual(['c', 'a', 'b']);
  });

  it('TC-API-055: 카드가 있는 다른 컬럼의 기준 카드 앞·뒤로 옮기면 상태가 바뀌고 그 자리에 놓인다', async () => {
    const a = await create('a');
    const b = await create('b');
    const x = await create('x');
    const y = await create('y');
    await putPosition(t.baseUrl, x.ticketId, {
      status: 'DONE',
      placement: 'AFTER',
    });
    await putPosition(t.baseUrl, y.ticketId, {
      status: 'DONE',
      anchorTicketId: x.ticketId,
      placement: 'AFTER',
    });

    await putPosition(t.baseUrl, a.ticketId, {
      status: 'DONE',
      anchorTicketId: y.ticketId,
      placement: 'BEFORE',
    });
    await putPosition(t.baseUrl, b.ticketId, {
      status: 'DONE',
      anchorTicketId: x.ticketId,
      placement: 'AFTER',
    });

    expect(await board()).toEqual({
      TODO: [],
      IN_PROGRESS: [],
      DONE: ['x', 'b', 'a', 'y'],
    });
  });

  it('TC-API-056: 컬럼 맨 앞으로 5번 반복해서 옮겨도 순서가 올바르다', async () => {
    const tickets = [];
    for (const title of ['a', 'b', 'c', 'd', 'e']) {
      tickets.push(await create(title));
    }
    const expected = ['a', 'b', 'c', 'd', 'e'];

    for (let round = 0; round < 5; round++) {
      const last = tickets[tickets.length - 1 - (round % tickets.length)]!;
      const first = (await (await listTickets(t.baseUrl)).json())[0]!;
      await putPosition(t.baseUrl, last.ticketId, {
        status: 'TODO',
        anchorTicketId: first.ticketId,
        placement: 'BEFORE',
      });
      const title = last.title;
      expected.splice(expected.indexOf(title), 1);
      expected.unshift(title);
      expect((await board()).TODO).toEqual(expected);
    }
  });

  it('TC-API-057: 두 카드 사이에 반복 삽입해도 순서가 유지된다', async () => {
    await create('a');
    const z = await create('z');
    const middles = [];
    for (let i = 0; i < 12; i++) {
      middles.push(await create(`m${i}`));
    }
    // 직전에 옮긴 카드의 앞으로 옮긴다: a와 z 사이의 같은 자리에 계속 끼워 넣는다.
    let upper = z.ticketId;
    for (const middle of middles) {
      await putPosition(t.baseUrl, middle.ticketId, {
        status: 'TODO',
        anchorTicketId: upper,
        placement: 'BEFORE',
      });
      upper = middle.ticketId;
    }

    expect((await board()).TODO).toEqual([
      'a',
      ...middles.map((m) => m.title).reverse(),
      'z',
    ]);
  });

  it('TC-API-058: 응답은 이동된 티켓(8개 필드, position 없음)이고 단건 조회와 같다', async () => {
    const a = await create('a');

    const body = await (
      await putPosition(t.baseUrl, a.ticketId, {
        status: 'DONE',
        placement: 'AFTER',
      })
    ).json();

    expect(Object.keys(body).sort()).toEqual(TICKET_RESPONSE_KEYS);
    expect(body).toEqual(await (await getTicket(t.baseUrl, a.ticketId)).json());
  });

  it('TC-API-059: 이동은 다른 티켓의 순서 키를 바꾸지 않는다', async () => {
    const a = await create('a');
    await create('b');
    const c = await create('c');
    const others =
      "SELECT string_agg(title || ':' || status || ':' || position, ',' ORDER BY title) FROM ticket WHERE title <> 'a'";
    const before = await t.sql(others);

    await putPosition(t.baseUrl, a.ticketId, {
      status: 'TODO',
      anchorTicketId: c.ticketId,
      placement: 'AFTER',
    });

    expect(await t.sql(others)).toBe(before);
  });

  it('TC-API-060: 컬럼의 유일한 카드를 같은 컬럼으로(기준 생략) 옮길 수 있다', async () => {
    const a = await create('a');

    const response = await putPosition(t.baseUrl, a.ticketId, {
      status: 'TODO',
      placement: 'AFTER',
    });

    expect(response.status).toBe(200);
    expect((await board()).TODO).toEqual(['a']);
  });

  it('TC-API-061: 같은 이동 요청을 두 번 보내도 결과 순서가 같다', async () => {
    const a = await create('a');
    await create('b');
    const c = await create('c');
    const request = {
      status: 'TODO',
      anchorTicketId: c.ticketId,
      placement: 'AFTER',
    };

    await putPosition(t.baseUrl, a.ticketId, request);
    const once = await board();
    const second = await putPosition(t.baseUrl, a.ticketId, request);

    expect(second.status).toBe(200);
    expect(await board()).toEqual(once);
  });

  it('TC-API-062: 이동 뒤 새 티켓을 만들면 TODO 맨 뒤에 놓인다', async () => {
    const a = await create('a');
    const b = await create('b');
    await putPosition(t.baseUrl, a.ticketId, {
      status: 'TODO',
      anchorTicketId: b.ticketId,
      placement: 'AFTER',
    });
    await putPosition(t.baseUrl, b.ticketId, {
      status: 'TODO',
      anchorTicketId: a.ticketId,
      placement: 'AFTER',
    });

    await create('new');

    expect((await board()).TODO).toEqual(['a', 'b', 'new']);
  });
});
