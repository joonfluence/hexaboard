/** 필드 하나의 검증 실패 사유. */
export interface FieldError {
  field: string;
  reason: string;
}

/** 경로의 ticketId가 UUID 형식이 아니다. 웹 계층의 오류다. */
export class InvalidTicketIdError extends Error {
  constructor(readonly value: string) {
    super(`ticketId는 UUID 형식이어야 합니다: ${value}`);
    this.name = 'InvalidTicketIdError';
  }
}

/** 요청 형식·값 검증에 실패했다. 필드별 사유를 담는다. */
export class ValidationFailedException extends Error {
  constructor(readonly details: FieldError[]) {
    super('요청 값이 올바르지 않습니다.');
    this.name = 'ValidationFailedException';
  }
}

/** 요청 본문이 JSON이 아니다. */
export class UnsupportedMediaTypeError extends Error {
  constructor() {
    super('Content-Type은 application/json이어야 합니다.');
    this.name = 'UnsupportedMediaTypeError';
  }
}
