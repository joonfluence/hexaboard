/** 같은 컬럼에서 순서 키가 충돌했다. (상태, 순서 키) 유니크 제약을 어겼을 때 저장소가 던진다. */
export class PositionConflictError extends Error {
  constructor(message = '순서 키가 충돌했습니다.') {
    super(message);
    this.name = 'PositionConflictError';
  }
}

/** 공개 식별자에 해당하는 티켓이 없다. */
export class TicketNotFoundError extends Error {
  constructor(readonly ticketId: string) {
    super(`티켓을 찾을 수 없습니다: ${ticketId}`);
    this.name = 'TicketNotFoundError';
  }
}
