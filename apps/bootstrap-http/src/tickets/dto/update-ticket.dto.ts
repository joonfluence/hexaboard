import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsISO8601,
  IsString,
  ValidateIf,
} from 'class-validator';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

/**
 * 티켓 부분 수정 요청. 생략한 필드는 그대로 둔다. 형식·타입만 검증하고 내용 규칙은 `domain`이 검증한다.
 * `description`·`dueAt`은 `null`로 비울 수 있고 `title`·`priority`는 비울 수 없다.
 */
export class UpdateTicketDto {
  @ApiPropertyOptional({ maxLength: 100, description: '앞뒤 공백은 제거된다.' })
  @ValidateIf((_, value) => value !== undefined)
  @IsString({ message: '제목은 null일 수 없으며 문자열이어야 합니다.' })
  title?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 2000,
    description: 'null·빈 문자열·공백뿐이면 설명이 지워진다.',
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString({ message: '설명은 문자열이어야 합니다.' })
  description?: string | null;

  @ApiPropertyOptional({ enum: PRIORITIES })
  @ValidateIf((_, value) => value !== undefined)
  @IsIn(PRIORITIES, {
    message: `우선순위는 ${PRIORITIES.join(', ')} 중 하나여야 하며 null일 수 없습니다.`,
  })
  priority?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'null이면 마감일이 지워진다.',
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsISO8601(
    { strict: true, strictSeparator: true },
    { message: '마감일은 ISO 8601 시각 형식이어야 합니다.' },
  )
  dueAt?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description:
      '앞뒤 공백 제거·소문자로 정규화, 중복 제거. 최대 10개, 이름 최대 30자.',
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsArray({ message: '태그는 문자열 배열이어야 합니다.' })
  @IsString({ each: true, message: '태그 이름은 문자열이어야 합니다.' })
  tags?: string[];
}
