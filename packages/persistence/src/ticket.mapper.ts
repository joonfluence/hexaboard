import { Ticket } from '@todo/domain';
import { TicketEntity } from './ticket.entity';

/** 우선순위는 DB에 순서를 나타내는 숫자로 저장한다(정렬이 자연스럽다). */
const PRIORITY_NUMBERS: Readonly<Record<string, number>> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
};

export class TicketMapper {
  priorityToNumber(priority: string): number {
    const stored = PRIORITY_NUMBERS[priority];
    if (stored === undefined) {
      throw new Error(`알 수 없는 우선순위: ${priority}`);
    }
    return stored;
  }

  numberToPriority(stored: number): string {
    const entry = Object.entries(PRIORITY_NUMBERS).find(
      ([, value]) => value === stored,
    );
    if (!entry) {
      throw new Error(`알 수 없는 우선순위 값: ${stored}`);
    }
    return entry[0];
  }

  /** 새 도메인 티켓 → 저장 전 엔티티. 내부 PK와 시각은 저장소가 채운다. */
  toEntity(ticket: Ticket): TicketEntity {
    const entity = new TicketEntity();
    Object.assign(entity, {
      publicId: ticket.ticketId,
      title: ticket.title.value,
      description: ticket.description,
      status: ticket.status,
      priority: this.priorityToNumber(ticket.priority.value),
      dueAt: ticket.dueAt,
      position: ticket.position.value,
    });
    return entity;
  }

  toDomain(entity: TicketEntity): Ticket {
    return Ticket.rehydrate({
      ticketId: entity.publicId,
      title: entity.title,
      description: entity.description ?? null,
      status: entity.status as 'TODO' | 'IN_PROGRESS' | 'DONE',
      priority: this.numberToPriority(entity.priority),
      dueAt: entity.dueAt ?? null,
      position: entity.position,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
