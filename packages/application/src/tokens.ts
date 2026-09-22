/** TS의 interface는 컴파일 후 사라지므로 주입에는 토큰이 필요하다. */
export const TICKET_REPOSITORY = Symbol('TicketRepository');

export const CREATE_TICKET = Symbol('CreateTicket');
export const GET_TICKET = Symbol('GetTicket');
export const LIST_TICKETS = Symbol('ListTickets');
export const DELETE_TICKET = Symbol('DeleteTicket');
export const UPDATE_TICKET = Symbol('UpdateTicket');
export const MOVE_TICKET = Symbol('MoveTicket');
export const SORT_COLUMN = Symbol('SortColumn');
