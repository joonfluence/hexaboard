import { describe, expect, it, vi } from 'vitest';
import { withRequestId } from '@/shared/api/request-id';
import { scrubItem, scrubUrl } from '@/shared/observability/faro';

describe('개인정보 마스킹', () => {
  it('주소의 쿼리스트링과 해시를 뗀다', () => {
    expect(scrubUrl('https://app.example/?q=비밀제목&tag=a#x')).toBe(
      'https://app.example/',
    );
    expect(scrubUrl('https://app.example/board')).toBe(
      'https://app.example/board',
    );
  });

  it('전송 항목의 페이지 주소에서 검색어를 제거한다', () => {
    const item = {
      type: 'event',
      payload: {},
      meta: { page: { url: 'https://app.example/?q=비밀제목' } },
    } as never;
    const result = scrubItem(item) as { meta: { page: { url: string } } };
    expect(result.meta.page.url).toBe('https://app.example/');
  });
});

describe('요청 ID 전송', () => {
  const request = () =>
    new Request('https://api.example/v1/tickets?q=비밀제목', {
      method: 'GET',
    });

  it('요청마다 X-Request-Id 헤더를 붙인다', async () => {
    const seen: string[] = [];
    const next = vi.fn(async (r: Request) => {
      seen.push(r.headers.get('X-Request-Id') ?? '');
      return new Response('[]', { status: 200 });
    });
    const send = withRequestId(next);
    await send(request());
    await send(request());
    expect(seen[0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(seen[0]).not.toBe(seen[1]);
  });

  it('5xx는 요청 ID·상태·경로와 함께 알리고 쿼리스트링은 뺀다', async () => {
    const report = vi.fn();
    const send = withRequestId(
      async () => new Response('x', { status: 503 }),
      report,
    );
    await send(request());
    expect(report).toHaveBeenCalledWith({
      requestId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      status: 503,
      method: 'GET',
      path: '/v1/tickets',
    });
  });

  it('4xx는 알리지 않고, 네트워크 오류는 알린 뒤 그대로 던진다', async () => {
    const report = vi.fn();
    await withRequestId(
      async () => new Response('x', { status: 404 }),
      report,
    )(request());
    expect(report).not.toHaveBeenCalled();

    const boom = new Error('network');
    await expect(
      withRequestId(async () => {
        throw boom;
      }, report)(request()),
    ).rejects.toBe(boom);
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ status: 0 }));
  });
});
