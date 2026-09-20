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

export class Ticket {
  private constructor(
    readonly ticketId: string,
    readonly title: Title,
    readonly description: string | null,
    readonly status: TicketStatus,
    readonly priority: Priority,
    readonly dueAt: Date | null,
    readonly position: Position,
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
}
