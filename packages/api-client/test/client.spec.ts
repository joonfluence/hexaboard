import { createApiClient } from '../src';

describe('createApiClient', () => {
  it('생성된 경로와 메서드로 서버를 호출하고 응답을 타입 있는 값으로 돌려준다', async () => {
    const requests: Request[] = [];
    const client = createApiClient('http://localhost:3456', async (request) => {
      requests.push(request);
      return Response.json([]);
    });

    const { data, response } = await client.GET('/v1/tickets');

    expect(requests[0]?.url).toBe('http://localhost:3456/v1/tickets');
    expect(requests[0]?.method).toBe('GET');
    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('이동 요청은 경로 매개변수와 본문을 채워 PUT으로 보낸다', async () => {
    const requests: Request[] = [];
    const client = createApiClient('http://localhost:3456', async (request) => {
      requests.push(request);
      return Response.json({});
    });

    await client.PUT('/v1/tickets/{ticketId}/position', {
      params: { path: { ticketId: 'abc' } },
      body: { status: 'DONE', placement: 'AFTER' },
    });

    expect(requests[0]?.url).toBe(
      'http://localhost:3456/v1/tickets/abc/position',
    );
    expect(requests[0]?.method).toBe('PUT');
    expect(await requests[0]?.json()).toEqual({
      status: 'DONE',
      placement: 'AFTER',
    });
  });
});
