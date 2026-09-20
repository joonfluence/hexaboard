/** TS의 interface는 컴파일 후 사라지므로 주입에는 토큰이 필요하다. */
export const TICKET_REPOSITORY = Symbol('TicketRepository');
