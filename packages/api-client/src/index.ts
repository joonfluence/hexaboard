import createClient from 'openapi-fetch';
import type { components, paths } from './schema';

export type { components, paths };

/** 서버가 돌려주는 티켓 표현(내부 PK와 순서 키는 없다). */
export type Ticket = components['schemas']['TicketResponse'];
export type TicketStatus = Ticket['status'];
export type TicketPriority = Ticket['priority'];
export type CreateTicketBody = components['schemas']['CreateTicketDto'];
export type UpdateTicketBody = components['schemas']['UpdateTicketDto'];
export type MovePositionBody = components['schemas']['MovePositionDto'];

/** 서버가 정한 오류 응답 형식(docs/api_spec.md). 프론트는 `message`가 아니라 `code`로 분기한다. */
export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: { field: string; reason: string }[];
}

/** 테스트에서 fetch를 바꿔 끼울 수 있다. */
export type FetchLike = (request: Request) => Promise<Response>;

/** 생성된 스키마 위의 타입 안전한 클라이언트. `baseUrl`에는 서버 주소를 준다(경로에 `/v1`이 이미 있다). */
export function createApiClient(baseUrl: string, fetchImpl?: FetchLike) {
  return createClient<paths>({ baseUrl, fetch: fetchImpl });
}

export type ApiClient = ReturnType<typeof createApiClient>;
