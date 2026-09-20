import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

/** 티켓 생성 요청. 검증 규칙은 US3에서 추가한다. */
export class CreateTicketDto {
  @ApiProperty({ maxLength: 100, description: '앞뒤 공백은 제거된다.' })
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2000 })
  description?: string | null;

  @ApiPropertyOptional({ enum: PRIORITIES, default: 'MEDIUM' })
  priority?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  dueAt?: string | null;
}
