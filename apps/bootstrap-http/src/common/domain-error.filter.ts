import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { PositionConflictError } from '@todo/application';

interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

/** 도메인·애플리케이션 오류를 HTTP 상태와 오류 코드로 변환한다. 웹 계층만 HTTP를 안다. */
@Catch(PositionConflictError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: PositionConflictError, host: ArgumentsHost): void {
    host.switchToHttp().getResponse<JsonResponse>().status(409).json({
      statusCode: 409,
      code: 'POSITION_CONFLICT',
      message: '순서가 충돌했습니다. 잠시 후 다시 시도해 주세요.',
    });
  }
}
