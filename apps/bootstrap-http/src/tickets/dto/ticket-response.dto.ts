import { ApiProperty } from '@nestjs/swagger';
import type { Ticket } from '@todo/domain';

/** 티켓 응답. 내부 PK와 순서 키(position)는 노출하지 않는다(D-80). */
export class TicketResponse {
  @ApiProperty({ format: 'uuid' })
  ticketId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ enum: ['TODO', 'IN_PROGRESS', 'DONE'] })
  status!: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  priority!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  dueAt!: string | null;

  @ApiProperty({ type: [String], description: '이름 오름차순.' })
  tags!: string[];

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export function toTicketResponse(ticket: Ticket): TicketResponse {
  return {
    ticketId: ticket.ticketId,
    title: ticket.title.value,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority.value,
    dueAt: ticket.dueAt?.toISOString() ?? null,
    tags: [...ticket.tags],
    createdAt: ticket.createdAt!.toISOString(),
    updatedAt: ticket.updatedAt!.toISOString(),
  };
}
