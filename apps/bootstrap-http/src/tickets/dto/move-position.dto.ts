import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsUUID, ValidateIf } from 'class-validator';

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const PLACEMENTS = ['BEFORE', 'AFTER'];

/**
 * 카드 이동 요청. 순서 값은 받지 않고 "기준 카드의 앞/뒤"만 받는다(서버가 순서 키를 계산한다).
 * 기준 카드와 대상 컬럼의 관계(자기 자신, 다른 컬럼, 기준 누락)는 `application`이 검증한다.
 */
export class MovePositionDto {
  @ApiProperty({ enum: STATUSES, description: '이동할 대상 컬럼.' })
  @IsIn(STATUSES, {
    message: `status는 ${STATUSES.join(', ')} 중 하나여야 합니다.`,
  })
  status!: 'TODO' | 'IN_PROGRESS' | 'DONE';

  @ApiPropertyOptional({
    format: 'uuid',
    description: '기준 카드. 대상 컬럼에 다른 카드가 없으면 생략한다.',
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsUUID('4', { message: 'anchorTicketId는 UUID 형식이어야 합니다.' })
  anchorTicketId?: string;

  @ApiProperty({ enum: PLACEMENTS, description: '기준 카드의 앞 또는 뒤.' })
  @IsIn(PLACEMENTS, {
    message: `placement는 ${PLACEMENTS.join(', ')} 중 하나여야 합니다.`,
  })
  placement!: 'BEFORE' | 'AFTER';
}
