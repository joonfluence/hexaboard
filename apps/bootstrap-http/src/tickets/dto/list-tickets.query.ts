import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

/** 반복 파라미터(`?tag=a&tag=b`)와 단일 값을 배열로 맞추고 빈 값은 버린다. */
const toList = ({ value }: { value: unknown }): unknown => {
  if (value === undefined) return undefined;
  const items = Array.isArray(value) ? value : [value];
  return items.filter((item) => item !== '');
};

/**
 * 목록 조회 조건. 종류가 다르면 AND, 같은 종류의 여러 값은 OR이다(FR-08, D-100).
 * 정의되지 않은 파라미터는 무시한다.
 */
export class ListTicketsQuery {
  @ApiPropertyOptional({ description: '제목·설명 부분 일치(대소문자 무시).' })
  @IsOptional()
  @IsString({ message: 'q는 하나의 문자열이어야 합니다.' })
  q?: string;

  @ApiPropertyOptional({ enum: STATUSES, isArray: true })
  @Transform(toList)
  @IsOptional()
  @IsIn(STATUSES, {
    each: true,
    message: `status는 ${STATUSES.join(', ')} 중 하나여야 합니다.`,
  })
  status?: string[];

  @ApiPropertyOptional({ enum: PRIORITIES, isArray: true })
  @Transform(toList)
  @IsOptional()
  @IsIn(PRIORITIES, {
    each: true,
    message: `priority는 ${PRIORITIES.join(', ')} 중 하나여야 합니다.`,
  })
  priority?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: '하나라도 가진 티켓(OR). 이름은 정규화해 비교한다.',
  })
  @Transform(toList)
  @IsOptional()
  @IsString({ each: true, message: 'tag는 문자열이어야 합니다.' })
  tag?: string[];
}
