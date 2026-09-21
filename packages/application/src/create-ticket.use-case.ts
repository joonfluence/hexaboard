import { Inject, Injectable } from '@nestjs/common';
import { Position, Ticket } from '@todo/domain';
import { PositionConflictError } from './errors';
import type { TicketRepository } from './ticket.repository';
import { TICKET_REPOSITORY } from './tokens';

/** 순서 키 충돌 시 최초 시도 후 재시도하는 최대 횟수(D-69, D-84). */
export const MAX_POSITION_RETRIES = 3;

export interface CreateTicketInput {
  title: string;
  description?: string | null;
  priority?: string;
  dueAt?: Date | null;
  tags?: unknown;
}

/** 새 티켓을 TODO 컬럼 맨 뒤에 만든다(D-79). */
@Injectable()
export class CreateTicket {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepository,
  ) {}

  async execute(input: CreateTicketInput): Promise<Ticket> {
    for (let attempt = 0; ; attempt++) {
      // 시도마다 마지막 순서 키를 다시 읽는다. 동시 생성이 그 사이에 끼어들었을 수 있다.
      const last = await this.tickets.findLastPosition('TODO');
      const position = last ? Position.after(last) : Position.first();
      try {
        return await this.tickets.save(Ticket.create({ ...input, position }));
      } catch (error) {
        if (
          !(error instanceof PositionConflictError) ||
          attempt >= MAX_POSITION_RETRIES
        ) {
          throw error;
        }
      }
    }
  }
}
