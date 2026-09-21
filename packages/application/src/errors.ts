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

/** 이동의 기준 카드에 해당하는 티켓이 없다. */
export class AnchorTicketNotFoundError extends Error {
  constructor(readonly anchorTicketId: string) {
    super(`기준 티켓을 찾을 수 없습니다: ${anchorTicketId}`);
    this.name = 'AnchorTicketNotFoundError';
  }
}

/** 이동 대상이 올바르지 않다: 기준 누락, 기준이 자기 자신, 기준이 대상 컬럼에 없음. */
export class InvalidPositionTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPositionTargetError';
  }
}
