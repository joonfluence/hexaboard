import { describe, expect, it } from 'vitest';
import { ApiError, toApiError, unwrap } from '@/shared/api/errors';

describe('오류 응답 변환 (shared/api)', () => {
  it('TC-UI-043: 서버 오류 형식을 statusCode·code·message·details를 가진 오류로 바꾼다', () => {
    const error = toApiError(400, {
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      message: '요청 값이 올바르지 않습니다.',
      details: [{ field: 'title', reason: '빈 값일 수 없습니다.' }],
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.details).toEqual([
      { field: 'title', reason: '빈 값일 수 없습니다.' },
    ]);
  });

  it.each([
    ['문자열 본문', 'oops'],
    ['code 없음', { statusCode: 500, message: 'x' }],
    ['null', null],
  ])('TC-UI-043: 형식이 다르면(%s) UNKNOWN이다', (_label, body) => {
    const error = toApiError(502, body);

    expect(error.code).toBe('UNKNOWN');
    expect(error.statusCode).toBe(502);
  });

  it('TC-UI-043: 성공 응답은 데이터를 돌려주고 204는 undefined다', async () => {
    const ok = await unwrap(
      Promise.resolve({ data: { a: 1 }, response: new Response(null) }),
    );
    const noContent = await unwrap(
      Promise.resolve({
        data: undefined,
        response: new Response(null, { status: 204 }),
      }),
    );

    expect(ok).toEqual({ a: 1 });
    expect(noContent).toBeUndefined();
  });

  it('TC-UI-043: 오류 응답은 code를 가진 ApiError로 던지고, 네트워크 실패는 NETWORK_ERROR다', async () => {
    const failed = unwrap(
      Promise.resolve({
        error: { statusCode: 404, code: 'TICKET_NOT_FOUND', message: 'x' },
        response: new Response(null, { status: 404 }),
      }),
    );
    const offline = unwrap(Promise.reject(new TypeError('fetch failed')));

    await expect(failed).rejects.toMatchObject({ code: 'TICKET_NOT_FOUND' });
    await expect(offline).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});
