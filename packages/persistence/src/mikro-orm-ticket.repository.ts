import { UniqueConstraintViolationException } from '@mikro-orm/core';
import type { MikroORM } from '@mikro-orm/postgresql';
import {
  PositionConflictError,
  type TicketRepository,
} from '@todo/application';
import { Position, type Ticket, type TicketStatus } from '@todo/domain';
import { TicketSchema } from './ticket.entity';
import { TicketMapper } from './ticket.mapper';

/** (상태, 순서 키) 유니크 제약의 이름. 마이그레이션이 정한다. */
const POSITION_UNIQUE_CONSTRAINT = 'ticket_status_position_key';

export class MikroOrmTicketRepository implements TicketRepository {
  constructor(
    private readonly orm: MikroORM,
    private readonly mapper: TicketMapper = new TicketMapper(),
  ) {}

  async save(ticket: Ticket): Promise<Ticket> {
    // 호출마다 새 컨텍스트를 써서 식별 맵이 요청 사이에 남지 않게 한다.
    const em = this.orm.em.fork();
    const entity = this.mapper.toEntity(ticket);
    em.persist(entity);
    try {
      await em.flush();
    } catch (error) {
      if (
        error instanceof UniqueConstraintViolationException &&
        (error as { constraint?: string }).constraint ===
          POSITION_UNIQUE_CONSTRAINT
      ) {
        throw new PositionConflictError();
      }
      throw error;
    }
    return this.mapper.toDomain(entity);
  }

  async findByTicketId(ticketId: string): Promise<Ticket | null> {
    const entity = await this.orm.em
      .fork()
      .findOne(TicketSchema, { publicId: ticketId });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findLastPosition(status: TicketStatus): Promise<Position | null> {
    const [last] = await this.orm.em
      .fork()
      .find(
        TicketSchema,
        { status },
        { orderBy: { position: 'desc' }, limit: 1 },
      );
    return last ? Position.from(last.position) : null;
  }
}
