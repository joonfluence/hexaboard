import { Inject, Injectable } from '@nestjs/common';
import {
  Position,
  type Placement,
  type Ticket,
  type TicketStatus,
} from '@todo/domain';
import {
  AnchorTicketNotFoundError,
  InvalidPositionTargetError,
  PositionConflictError,
  TicketNotFoundError,
} from './errors';
import { MAX_POSITION_RETRIES } from './create-ticket.use-case';
import type { TicketRepository } from './ticket.repository';
import { TICKET_REPOSITORY } from './tokens';

export interface MoveTicketInput {
  ticketId: string;
  /** 대상 컬럼(상태). */
  status: TicketStatus;
  /** 기준 카드. 이동할 카드 말고 대상 컬럼에 카드가 없으면 생략해야 하고, 있으면 필수다. */
  anchorTicketId?: string;
  placement: Placement;
}

/** 카드를 대상 컬럼의 기준 카드 앞/뒤로 옮긴다. 순서 키는 서버가 계산한다(D-95). */
@Injectable()
export class MoveTicket {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepository,
  ) {}

  async execute(input: MoveTicketInput): Promise<Ticket> {
    for (let attempt = 0; ; attempt++) {
      try {
        // 시도마다 이동할 카드·기준 카드·이웃을 다시 읽는다. 동시 요청이 그 사이에 끼어들었을 수 있다.
        const position = await this.resolvePosition(input);
        const moved = await this.tickets.move(
          input.ticketId,
          input.status,
          position,
        );
        if (!moved) {
          throw new TicketNotFoundError(input.ticketId);
        }
        return moved;
      } catch (error) {
        // 재시도 중 기준 카드가 사라지거나 대상 컬럼을 벗어났다면 동시 변경으로 보고 충돌로 다룬다.
        if (
          attempt > 0 &&
          (error instanceof AnchorTicketNotFoundError ||
            error instanceof InvalidPositionTargetError)
        ) {
          throw new PositionConflictError();
        }
        if (
          !(error instanceof PositionConflictError) ||
          attempt >= MAX_POSITION_RETRIES
        ) {
          throw error;
        }
      }
    }
  }

  private async resolvePosition(input: MoveTicketInput): Promise<Position> {
    const { ticketId, status, anchorTicketId, placement } = input;
    if (!(await this.tickets.findByTicketId(ticketId))) {
      throw new TicketNotFoundError(ticketId);
    }

    if (anchorTicketId === undefined) {
      if (await this.tickets.hasTicketsInStatus(status, ticketId)) {
        throw new InvalidPositionTargetError(
          '카드가 있는 컬럼으로 옮길 때는 기준 카드가 필요합니다.',
        );
      }
      return Position.first();
    }
    if (anchorTicketId === ticketId) {
      throw new InvalidPositionTargetError(
        '기준 카드가 이동할 카드 자신일 수 없습니다.',
      );
    }
    const anchor = await this.tickets.findByTicketId(anchorTicketId);
    if (!anchor) {
      throw new AnchorTicketNotFoundError(anchorTicketId);
    }
    if (anchor.status !== status) {
      throw new InvalidPositionTargetError(
        '기준 카드가 대상 컬럼에 있지 않습니다.',
      );
    }

    // 이동할 카드 자신은 이웃으로 치지 않는다.
    const neighbor = await this.tickets.findAdjacentPosition(
      status,
      anchor.position,
      placement,
      ticketId,
    );
    return placement === 'BEFORE'
      ? Position.between(neighbor, anchor.position)
      : Position.between(anchor.position, neighbor);
  }
}
