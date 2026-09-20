import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { PositionConflictError, TicketNotFoundError } from '@todo/application';
import { InvalidTicketIdError } from './http-errors';

interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
}

function toErrorBody(exception: unknown): ErrorBody {
  if (exception instanceof PositionConflictError) {
    return {
      statusCode: 409,
      code: 'POSITION_CONFLICT',
      message: '순서가 충돌했습니다. 잠시 후 다시 시도해 주세요.',
    };
  }
  if (exception instanceof TicketNotFoundError) {
    return {
      statusCode: 404,
      code: 'TICKET_NOT_FOUND',
      message: '티켓을 찾을 수 없습니다.',
    };
  }
  // InvalidTicketIdError
  return {
    statusCode: 400,
    code: 'INVALID_TICKET_ID',
    message: 'ticketId는 UUID 형식이어야 합니다.',
  };
}

/** 도메인·애플리케이션·웹 오류를 HTTP 상태와 오류 코드로 변환한다. 웹 계층만 HTTP를 안다. */
@Catch(PositionConflictError, TicketNotFoundError, InvalidTicketIdError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const body = toErrorBody(exception);
    host
      .switchToHttp()
      .getResponse<JsonResponse>()
      .status(body.statusCode)
      .json(body);
  }
}
