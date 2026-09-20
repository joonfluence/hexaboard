/** 경로의 ticketId가 UUID 형식이 아니다. 웹 계층의 오류다. */
export class InvalidTicketIdError extends Error {
  constructor(readonly value: string) {
    super(`ticketId는 UUID 형식이어야 합니다: ${value}`);
    this.name = 'InvalidTicketIdError';
  }
}
