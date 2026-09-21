import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const SORT_BY = ['PRIORITY', 'DUE_AT'];
const DIRECTIONS = ['ASC', 'DESC'];

/** 컬럼 정렬 요청. 실행하면 그 컬럼의 순서가 덮어써진다(실행 취소 없음). */
export class SortColumnDto {
  @ApiProperty({ enum: STATUSES })
  @IsIn(STATUSES, {
    message: `status는 ${STATUSES.join(', ')} 중 하나여야 합니다.`,
  })
  status!: 'TODO' | 'IN_PROGRESS' | 'DONE';

  @ApiProperty({ enum: SORT_BY })
  @IsIn(SORT_BY, {
    message: `sortBy는 ${SORT_BY.join(', ')} 중 하나여야 합니다.`,
  })
  sortBy!: 'PRIORITY' | 'DUE_AT';

  @ApiProperty({ enum: DIRECTIONS })
  @IsIn(DIRECTIONS, {
    message: `direction은 ${DIRECTIONS.join(', ')} 중 하나여야 합니다.`,
  })
  direction!: 'ASC' | 'DESC';
}
