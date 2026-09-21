import type { FetchLike } from '@todo/api-client';
import type { ApiFailure } from '@/shared/observability/faro';

export const REQUEST_ID_HEADER = 'X-Request-Id';

/**
 * 요청마다 ID를 만들어 서버로 보낸다. 서버 접근 로그의 `requestId`와 같은 값이라
 * 프런트 오류에서 백엔드 요청을 찾을 수 있다. 5xx와 네트워크 오류는 `report`로 알린다.
 */
export function withRequestId(
  next: FetchLike,
  report?: (failure: ApiFailure) => void,
): FetchLike {
  return async (request) => {
    const requestId = crypto.randomUUID();
    request.headers.set(REQUEST_ID_HEADER, requestId);
    const failure = (status: number): ApiFailure => ({
      requestId,
      status,
      method: request.method,
      path: new URL(request.url).pathname,
    });
    try {
      const response = await next(request);
      if (response.status >= 500) {
        report?.(failure(response.status));
      }
      return response;
    } catch (error) {
      report?.(failure(0));
      throw error;
    }
  };
}
