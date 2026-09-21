import type { Placement, Position, Ticket, TicketStatus } from '@todo/domain';

/** 티켓 저장소 포트. 구현은 `persistence`가 맡는다. */
export interface TicketRepository {
  /** 저장하고, 저장소가 채운 값(시각 등)이 담긴 티켓을 돌려준다. 같은 (상태, 순서 키)가 있으면 PositionConflictError. */
  save(ticket: Ticket): Promise<Ticket>;
  findByTicketId(ticketId: string): Promise<Ticket | null>;
  /** 상태(컬럼)에서 가장 뒤에 있는 카드의 순서 키. 비어 있으면 null. */
  findLastPosition(status: TicketStatus): Promise<Position | null>;
  /** 모든 티켓. 상태 순서(`TICKET_STATUSES`), 같은 상태 안에서는 순서 키 오름차순. */
  findAll(): Promise<Ticket[]>;
  /** 수정한 티켓의 내용을 저장하고 저장소가 채운 값이 담긴 티켓을 돌려준다. 없으면 null. 상태·순서 키는 바꾸지 않는다. */
  update(ticket: Ticket): Promise<Ticket | null>;
  /** 공개 식별자로 삭제한다. 지웠으면 true, 없으면 false. */
  deleteByTicketId(ticketId: string): Promise<boolean>;
  /**
   * 같은 상태 컬럼에서 기준 순서 키 바로 앞(BEFORE)·뒤(AFTER) 카드의 순서 키. 없으면 null.
   * `excludeTicketId`(이동할 카드 자신)는 이웃으로 치지 않는다.
   */
  findAdjacentPosition(
    status: TicketStatus,
    position: Position,
    side: Placement,
    excludeTicketId: string,
  ): Promise<Position | null>;
  /** `excludeTicketId`를 뺀 카드가 그 상태 컬럼에 하나라도 있는지. */
  hasTicketsInStatus(
    status: TicketStatus,
    excludeTicketId: string,
  ): Promise<boolean>;
  /**
   * 상태와 순서 키만 바꿔 저장하고 저장소가 채운 값이 담긴 티켓을 돌려준다. 없으면 null.
   * 같은 (상태, 순서 키)가 있으면 PositionConflictError.
   */
  move(
    ticketId: string,
    status: TicketStatus,
    position: Position,
  ): Promise<Ticket | null>;
}
