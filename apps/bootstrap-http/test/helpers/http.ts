/** 응답 본문. 티켓 응답과 오류 응답의 필드를 모두 담는다. */
export interface TicketBody {
  ticketId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  statusCode?: number;
  code?: string;
  message?: string;
  details?: { field: string; reason: string }[];
}

export interface ApiResponse {
  status: number;
  json(): Promise<TicketBody>;
}

/** 티켓 생성 요청. 본문은 JSON으로 직렬화한다. */
export async function postTicket(
  baseUrl: string,
  body: unknown,
): Promise<ApiResponse> {
  const response = await fetch(`${baseUrl}/v1/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    // fetch의 json()은 unknown이다. 테스트 하네스 경계에서 한 번만 응답 타입을 지정한다.
    json: () => response.json() as Promise<TicketBody>,
  };
}

/** 본문을 직렬화하지 않고 그대로 보낸다(잘못된 JSON, 다른 Content-Type 시험용). */
export async function postRaw(
  baseUrl: string,
  rawBody: string,
  contentType: string,
): Promise<ApiResponse> {
  const response = await fetch(`${baseUrl}/v1/tickets`, {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: rawBody,
  });
  return {
    status: response.status,
    json: () => response.json() as Promise<TicketBody>,
  };
}

/** 티켓 한 건 조회 요청. */
export async function getTicket(
  baseUrl: string,
  ticketId: string,
): Promise<ApiResponse> {
  const response = await fetch(`${baseUrl}/v1/tickets/${ticketId}`);
  return {
    status: response.status,
    json: () => response.json() as Promise<TicketBody>,
  };
}

/** 목록 조회 요청. 본문은 티켓 배열이다. */
export async function listTickets(baseUrl: string): Promise<{
  status: number;
  json(): Promise<TicketBody[]>;
}> {
  const response = await fetch(`${baseUrl}/v1/tickets`);
  return {
    status: response.status,
    json: () => response.json() as Promise<TicketBody[]>,
  };
}

/** 티켓 삭제 요청. 성공하면 본문이 없다. */
export async function deleteTicket(
  baseUrl: string,
  ticketId: string,
): Promise<ApiResponse & { text(): Promise<string> }> {
  const response = await fetch(`${baseUrl}/v1/tickets/${ticketId}`, {
    method: 'DELETE',
  });
  return {
    status: response.status,
    json: () => response.json() as Promise<TicketBody>,
    text: () => response.text(),
  };
}

/** 티켓 부분 수정 요청. */
export async function patchTicket(
  baseUrl: string,
  ticketId: string,
  body: unknown,
): Promise<ApiResponse> {
  const response = await fetch(`${baseUrl}/v1/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    json: () => response.json() as Promise<TicketBody>,
  };
}

/** 본문을 직렬화하지 않고 그대로 보내는 수정 요청(잘못된 JSON, 다른 Content-Type 시험용). */
export async function patchRaw(
  baseUrl: string,
  ticketId: string,
  rawBody: string,
  contentType: string,
): Promise<ApiResponse> {
  const response = await fetch(`${baseUrl}/v1/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { 'content-type': contentType },
    body: rawBody,
  });
  return {
    status: response.status,
    json: () => response.json() as Promise<TicketBody>,
  };
}

export const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** 티켓 응답이 가져야 하는 필드 전체. 내부 PK(id), position, tags는 없어야 한다. */
export const TICKET_RESPONSE_KEYS = [
  'createdAt',
  'description',
  'dueAt',
  'priority',
  'status',
  'ticketId',
  'title',
  'updatedAt',
];
