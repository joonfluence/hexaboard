import { randomUUID } from 'node:crypto';
import { normalizeDescription } from './description';
import { Position } from './position';
import { Priority } from './priority';
import { Title } from './title';

export type TicketStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface CreateTicketProps {
  title: string;
  description?: string | null;
  priority?: string;
  dueAt?: Date | null;
  position: Position;
}

export interface RehydrateTicketProps {
  ticketId: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: string;
  dueAt: Date | null;
  position: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Ticket {
  private constructor(
    readonly ticketId: string,
    readonly title: Title,
    readonly description: string | null,
    readonly status: TicketStatus,
    readonly priority: Priority,
    readonly dueAt: Date | null,
    readonly position: Position,
    /** 저장소가 채우는 시각. 저장 전의 새 티켓에는 없다(도메인은 시계를 모른다). */
    readonly createdAt?: Date,
    readonly updatedAt?: Date,
  ) {}

  /** 새 티켓. 공개 식별자(UUID v4)는 여기서 만들고 상태는 항상 TODO다. */
  static create(props: CreateTicketProps): Ticket {
    return new Ticket(
      randomUUID(),
      Title.of(props.title),
      normalizeDescription(props.description),
      'TODO',
      Priority.of(props.priority),
      props.dueAt ?? null,
      props.position,
    );
  }

  /** 저장소에서 읽은 값으로 복원한다. 새 식별자를 만들지 않고 값은 다시 검증한다. */
  static rehydrate(props: RehydrateTicketProps): Ticket {
    return new Ticket(
      props.ticketId,
      Title.of(props.title),
      normalizeDescription(props.description),
      props.status,
      Priority.of(props.priority),
      props.dueAt,
      Position.from(props.position),
      props.createdAt,
      props.updatedAt,
    );
  }
}
