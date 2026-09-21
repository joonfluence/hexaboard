import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

/** 플랫폼 헬스체크용 생존 확인. DB를 조회하지 않는다(유휴 DB를 깨우지 않기 위해). API 명세에는 넣지 않는다. */
@ApiExcludeController()
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
