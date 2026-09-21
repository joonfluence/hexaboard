import type { FetchLike, Ticket, TicketStatus } from '@todo/api-client';

const STATUS_ORDER: TicketStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export interface RecordedCall {
  method: string;
  path: string;
  body: unknown;
}

type Responder = (call: RecordedCall) => Response | Promise<Response>;

interface Override {
  method: string;
  path: RegExp;
  respond: Responder;
}

export const errorResponse = (
  status: number,
  code: string,
  details?: { field: string; reason: string }[],
) =>
  Response.json(
    { statusCode: status, code, message: `${code} 메시지`, details },
    { status },
  );

/** 서버 API(docs/api_spec.md)를 흉내 내는 대역. 호출을 기록하고 응답을 바꿔 끼울 수 있다. */
export function createFakeServer(initial: Ticket[] = []) {
  let tickets = [...initial];
  let sequence = 0;
  const calls: RecordedCall[] = [];
  const overrides: Override[] = [];

  const listed = () =>
    STATUS_ORDER.flatMap((status) =>
      tickets.filter((t) => t.status === status),
    );

  const defaultRespond: Responder = ({ method, path, body }) => {
    const single = /^\/v1\/tickets\/([^/]+)$/.exec(path);
    const position = /^\/v1\/tickets\/([^/]+)\/position$/.exec(path);
    const input = (body ?? {}) as Record<string, unknown>;

    if (path === '/v1/tickets' && method === 'GET') {
      return Response.json(listed());
    }
    if (path === '/v1/tickets' && method === 'POST') {
      const title =
        typeof input['title'] === 'string' ? input['title'].trim() : '';
      if (!title) {
        return errorResponse(400, 'VALIDATION_FAILED', [
          { field: 'title', reason: '빈 값일 수 없습니다.' },
        ]);
      }
      sequence += 1;
      const created: Ticket = {
        ticketId: `new-${sequence}`,
        title,
        description: null,
        status: 'TODO',
        priority: 'MEDIUM',
        dueAt: null,
        createdAt: '2026-09-21T00:00:00.000Z',
        updatedAt: '2026-09-21T00:00:00.000Z',
      };
      tickets.push(created);
      return Response.json(created, { status: 201 });
    }
    if (position && method === 'PUT') {
      const id = position[1];
      const moving = tickets.find((t) => t.ticketId === id);
      if (!moving) return errorResponse(404, 'TICKET_NOT_FOUND');
      const status = input['status'] as TicketStatus;
      const rest = tickets.filter((t) => t !== moving);
      const moved = { ...moving, status };
      const anchorId = input['anchorTicketId'];
      const at =
        typeof anchorId === 'string'
          ? rest.findIndex((t) => t.ticketId === anchorId) +
            (input['placement'] === 'AFTER' ? 1 : 0)
          : rest.length;
      rest.splice(at, 0, moved);
      tickets = rest;
      return Response.json(moved);
    }
    if (single && method === 'PATCH') {
      const target = tickets.find((t) => t.ticketId === single[1]);
      if (!target) return errorResponse(404, 'TICKET_NOT_FOUND');
      const patched = { ...target, ...input } as Ticket;
      tickets = tickets.map((t) => (t === target ? patched : t));
      return Response.json(patched);
    }
    if (single && method === 'DELETE') {
      if (!tickets.some((t) => t.ticketId === single[1])) {
        return errorResponse(404, 'TICKET_NOT_FOUND');
      }
      tickets = tickets.filter((t) => t.ticketId !== single[1]);
      return new Response(null, { status: 204 });
    }
    return errorResponse(404, 'NOT_FOUND');
  };

  const fetch: FetchLike = async (request) => {
    const url = new URL(request.url);
    const text = await request.text();
    const call: RecordedCall = {
      method: request.method,
      path: url.pathname,
      body: text ? JSON.parse(text) : undefined,
    };
    calls.push(call);
    const override = overrides.find(
      (o) => o.method === call.method && o.path.test(call.path),
    );
    return (override?.respond ?? defaultRespond)(call);
  };

  return {
    fetch,
    calls,
    /** 서버가 가진 티켓(컬럼 순서대로). */
    get tickets() {
      return listed();
    },
    /** 조건에 맞는 요청의 응답을 바꾼다(가장 먼저 등록한 것이 우선). */
    override(method: string, path: RegExp, respond: Responder) {
      overrides.push({ method, path, respond });
    },
    callsTo(method: string, path: RegExp) {
      return calls.filter((c) => c.method === method && path.test(c.path));
    },
  };
}

export type FakeServer = ReturnType<typeof createFakeServer>;

/** 응답을 직접 풀어 줄 때까지 붙잡아 두는 문. */
export function gate() {
  let release!: () => void;
  const opened = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { opened, release };
}
