import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsString, ValidateIf } from 'class-validator';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

/**
 * 티켓 생성 요청. 이 DTO는 형식·타입만 검증하고, 제목·설명의 내용 규칙(공백, 길이)은
 * `domain`의 값 객체가 검증한다.
 */
export class CreateTicketDto {
  @ApiProperty({ maxLength: 100, description: '앞뒤 공백은 제거된다.' })
  @IsString({ message: '제목은 필수이며 문자열이어야 합니다.' })
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2000 })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString({ message: '설명은 문자열이어야 합니다.' })
  description?: string | null;

  @ApiPropertyOptional({ enum: PRIORITIES, default: 'MEDIUM' })
  @ValidateIf((_, value) => value !== undefined)
  @IsIn(PRIORITIES, {
    message: `우선순위는 ${PRIORITIES.join(', ')} 중 하나여야 하며 null일 수 없습니다.`,
  })
  priority?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsISO8601(
    { strict: true, strictSeparator: true },
    { message: '마감일은 ISO 8601 시각 형식이어야 합니다.' },
  )
  dueAt?: string | null;
}
