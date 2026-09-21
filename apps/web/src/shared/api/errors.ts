import type { ApiErrorBody } from '@todo/api-client';

/** 서버가 정한 오류 응답(또는 네트워크 실패)을 나타낸다. 프론트는 `message`가 아니라 `code`로 분기한다. */
export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details: ApiErrorBody['details'] = undefined,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const isErrorBody = (body: unknown): body is ApiErrorBody =>
  typeof body === 'object' &&
  body !== null &&
  typeof (body as ApiErrorBody).code === 'string' &&
  typeof (body as ApiErrorBody).message === 'string';

/** 오류 응답 본문을 ApiError로 바꾼다. 형식이 다르면 code는 `UNKNOWN`이다. */
export function toApiError(statusCode: number, body: unknown): ApiError {
  if (isErrorBody(body)) {
    return new ApiError(statusCode, body.code, body.message, body.details);
  }
  return new ApiError(statusCode, 'UNKNOWN', '알 수 없는 오류가 발생했습니다.');
}

interface Settled {
  data?: unknown;
  error?: unknown;
  response: Response;
}

type Payload<R extends Settled> = Exclude<
  R extends { data?: infer D } ? D : never,
  undefined
>;

/** 성공 결과의 `data` 타입. 본문이 없는 응답(204)이면 undefined다. */
type Data<R extends Settled> = [Payload<R>] extends [never]
  ? undefined
  : Payload<R>;

/** openapi-fetch 결과를 풀어 데이터를 돌려주고, 오류 응답이나 네트워크 실패는 ApiError로 던진다. */
export async function unwrap<R extends Settled>(
  call: Promise<R>,
): Promise<Data<R>> {
  let result: R;
  try {
    result = await call;
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결하지 못했습니다.');
  }
  if (result.error !== undefined || !result.response.ok) {
    throw toApiError(result.response.status, result.error);
  }
  return result.data as Data<R>;
}
