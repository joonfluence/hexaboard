import { randomUUID } from 'node:crypto';
import { normalizeDescription } from './description';
import { Position } from './position';
import { Priority } from './priority';
import { Title } from './title';

/** 보드 컬럼 순서다. */
export const TICKET_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

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

/** 수정할 값. 생략(undefined)한 필드는 그대로 둔다. `description`·`dueAt`은 null로 비울 수 있다. */
export interface TicketChanges {
  title?: unknown;
  description?: unknown;
  priority?: unknown;
  dueAt?: Date | null;
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

  /** 제목·설명·우선순위·마감일을 고친 새 티켓을 돌려준다(불변). 식별자·상태·순서 키·시각은 그대로다. */
  update(changes: TicketChanges): Ticket {
    return new Ticket(
      this.ticketId,
      changes.title === undefined ? this.title : Title.of(changes.title),
      changes.description === undefined
        ? this.description
        : normalizeDescription(changes.description),
      this.status,
      changes.priority === undefined
        ? this.priority
        : Priority.of(changes.priority),
      changes.dueAt === undefined ? this.dueAt : changes.dueAt,
      this.position,
      this.createdAt,
      this.updatedAt,
    );
  }
}
