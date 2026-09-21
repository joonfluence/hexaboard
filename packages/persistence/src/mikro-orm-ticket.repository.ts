import { UniqueConstraintViolationException } from '@mikro-orm/core';
import type { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import {
  PositionConflictError,
  type TicketRepository,
} from '@todo/application';
import {
  Position,
  TICKET_STATUSES,
  type Placement,
  type Ticket,
  type TicketStatus,
} from '@todo/domain';
import { TicketSchema, type TicketEntity } from './ticket.entity';
import { TicketMapper } from './ticket.mapper';
import { TicketTags } from './ticket-tags';

/** (상태, 순서 키) 유니크 제약의 이름. 마이그레이션이 정한다. */
const POSITION_UNIQUE_CONSTRAINT = 'ticket_status_position_key';

/** (상태, 순서 키) 유니크 제약 위반이면 PositionConflictError, 아니면 그대로. */
function toConflict(error: unknown): unknown {
  return error instanceof UniqueConstraintViolationException &&
    (error as { constraint?: string }).constraint === POSITION_UNIQUE_CONSTRAINT
    ? new PositionConflictError()
    : error;
}

export class MikroOrmTicketRepository implements TicketRepository {
  constructor(
    private readonly orm: MikroORM,
    private readonly mapper: TicketMapper = new TicketMapper(),
    private readonly tags: TicketTags = new TicketTags(),
  ) {}

  /** 엔티티들을 태그와 함께 도메인 티켓으로 바꾼다(태그는 한 번의 쿼리로 읽는다). */
  private async toDomainAll(
    em: EntityManager,
    entities: readonly TicketEntity[],
  ): Promise<Ticket[]> {
    const byPk = await this.tags.read(
      em,
      entities.map((entity) => entity.id),
    );
    return entities.map((entity) =>
      this.mapper.toDomain(entity, byPk.get(entity.id) ?? []),
    );
  }

  async save(ticket: Ticket): Promise<Ticket> {
    // 호출마다 새 컨텍스트를 써서 식별 맵이 요청 사이에 남지 않게 한다.
    const em = this.orm.em.fork();
    const entity = this.mapper.toEntity(ticket);
    try {
      await em.transactional(async (tx) => {
        tx.persist(entity);
        await tx.flush();
        await this.tags.replace(tx, entity.id, ticket.tags);
      });
    } catch (error) {
      throw toConflict(error);
    }
    return this.mapper.toDomain(entity, ticket.tags);
  }

  /** 저장하고, (상태, 순서 키) 유니크 제약 위반은 PositionConflictError로 바꾼다. */
  private async flushOrConflict(em: EntityManager): Promise<void> {
    try {
      await em.flush();
    } catch (error) {
      throw toConflict(error);
    }
  }

  async findByTicketId(ticketId: string): Promise<Ticket | null> {
    const em = this.orm.em.fork();
    const entity = await em.findOne(TicketSchema, { publicId: ticketId });
    return entity ? (await this.toDomainAll(em, [entity]))[0]! : null;
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

  async findAll(): Promise<Ticket[]> {
    const em = this.orm.em.fork();
    const entities = await em.find(
      TicketSchema,
      {},
      { orderBy: { position: 'asc' } },
    );
    const domain = await this.toDomainAll(em, entities);
    // 순서 키(C collation) 순으로 읽은 뒤 상태로 안정 정렬해 컬럼 안 순서를 유지한다.
    const rank = (status: string) =>
      TICKET_STATUSES.indexOf(status as TicketStatus);
    return domain.toSorted((a, b) => rank(a.status) - rank(b.status));
  }

  async update(ticket: Ticket): Promise<Ticket | null> {
    const em = this.orm.em.fork();
    const entity = await em.findOne(TicketSchema, {
      publicId: ticket.ticketId,
    });
    if (!entity) {
      return null;
    }
    // 내용 필드만 덮어쓴다. 상태와 순서 키는 카드 이동만 바꾼다.
    entity.title = ticket.title.value;
    entity.description = ticket.description;
    entity.priority = this.mapper.priorityToNumber(ticket.priority.value);
    entity.dueAt = ticket.dueAt;
    // 태그만 바뀌어도 수정 시각이 갱신되도록 명시한다.
    entity.updatedAt = new Date();
    await em.transactional(async (tx) => {
      await tx.flush();
      await this.tags.replace(tx, entity.id, ticket.tags);
    });
    return this.mapper.toDomain(entity, ticket.tags);
  }

  async deleteByTicketId(ticketId: string): Promise<boolean> {
    const deleted = await this.orm.em
      .fork()
      .nativeDelete(TicketSchema, { publicId: ticketId });
    return deleted > 0;
  }

  async findAdjacentPosition(
    status: TicketStatus,
    position: Position,
    side: Placement,
    excludeTicketId: string,
  ): Promise<Position | null> {
    const before = side === 'BEFORE';
    const [neighbor] = await this.orm.em.fork().find(
      TicketSchema,
      {
        status,
        publicId: { $ne: excludeTicketId },
        position: before ? { $lt: position.value } : { $gt: position.value },
      },
      { orderBy: { position: before ? 'desc' : 'asc' }, limit: 1 },
    );
    return neighbor ? Position.from(neighbor.position) : null;
  }

  async hasTicketsInStatus(
    status: TicketStatus,
    excludeTicketId: string,
  ): Promise<boolean> {
    const count = await this.orm.em
      .fork()
      .count(TicketSchema, { status, publicId: { $ne: excludeTicketId } });
    return count > 0;
  }

  async move(
    ticketId: string,
    status: TicketStatus,
    position: Position,
  ): Promise<Ticket | null> {
    const em = this.orm.em.fork();
    const entity = await em.findOne(TicketSchema, { publicId: ticketId });
    if (!entity) {
      return null;
    }
    // 상태와 순서 키만 바꾼다. 나머지 내용은 수정(PATCH)만 바꾼다.
    entity.status = status;
    entity.position = position.value;
    await this.flushOrConflict(em);
    return (await this.toDomainAll(em, [entity]))[0]!;
  }

  async findByStatus(status: TicketStatus): Promise<Ticket[]> {
    const em = this.orm.em.fork();
    const entities = await em.find(
      TicketSchema,
      { status },
      { orderBy: { position: 'asc' } },
    );
    return this.toDomainAll(em, entities);
  }

  async reorder(
    status: TicketStatus,
    assignments: readonly { ticketId: string; position: Position }[],
  ): Promise<void> {
    try {
      await this.orm.em.fork().transactional(async (tx) => {
        // 1단계: 카드마다 유일한 임시 키로 옮겨 새 키가 다른 카드의 기존 키와 겹쳐도 충돌하지 않게 한다.
        for (const { ticketId } of assignments) {
          await tx.nativeUpdate(
            TicketSchema,
            { publicId: ticketId, status },
            { position: `~${ticketId}` },
          );
        }
        // 2단계: 최종 키를 쓴다.
        for (const { ticketId, position } of assignments) {
          await tx.nativeUpdate(
            TicketSchema,
            { publicId: ticketId, status },
            { position: position.value },
          );
        }
      });
    } catch (error) {
      throw toConflict(error);
    }
  }
}
