import type { Placement, Position, Ticket, TicketStatus } from '@todo/domain';

/** 목록 조회 조건. 종류가 다르면 AND, 같은 종류의 여러 값은 OR이다(FR-08). 비어 있거나 생략한 종류는 조건이 아니다. */
export interface TicketFilter {
  /** 제목·설명에서 대소문자를 구분하지 않는 부분 일치. */
  q?: string;
  statuses?: readonly TicketStatus[];
  priorities?: readonly string[];
  /** 태그 이름. 정규화(공백 제거·소문자)해 비교한다. */
  tags?: readonly string[];
}

/** 티켓 저장소 포트. 구현은 `persistence`가 맡는다. */
export interface TicketRepository {
  /** 저장하고, 저장소가 채운 값(시각 등)이 담긴 티켓을 돌려준다. 같은 (상태, 순서 키)가 있으면 PositionConflictError. */
  save(ticket: Ticket): Promise<Ticket>;
  findByTicketId(ticketId: string): Promise<Ticket | null>;
  /** 상태(컬럼)에서 가장 뒤에 있는 카드의 순서 키. 비어 있으면 null. */
  findLastPosition(status: TicketStatus): Promise<Position | null>;
  /** 조건에 맞는 모든 티켓(조건이 없으면 전체). 상태 순서(`TICKET_STATUSES`), 같은 상태 안에서는 순서 키 오름차순. */
  findAll(filter?: TicketFilter): Promise<Ticket[]>;
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
  /** 그 상태 컬럼의 카드를 순서 키 오름차순으로. */
  findByStatus(status: TicketStatus): Promise<Ticket[]>;
  /**
   * 컬럼 카드의 순서 키를 한 번에 다시 쓴다(한 트랜잭션, 다른 카드의 기존 키와 겹쳐도 성공).
   * 동시 변경으로 (상태, 순서 키)가 충돌하면 PositionConflictError.
   */
  reorder(
    status: TicketStatus,
    assignments: readonly { ticketId: string; position: Position }[],
  ): Promise<void>;
}
