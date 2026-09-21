import {
  BadRequestException,
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import {
  AnchorTicketNotFoundError,
  InvalidPositionTargetError,
  PositionConflictError,
  TicketNotFoundError,
} from '@todo/application';
import { DomainError } from '@todo/domain';
import {
  InvalidTicketIdError,
  UnsupportedMediaTypeError,
  ValidationFailedException,
  type FieldError,
} from './http-errors';

interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: FieldError[];
}

/** body-parser가 던지는 http-errors 형태의 오류. */
interface ParserError {
  type?: string;
  status?: number;
  statusCode?: number;
}

const VALIDATION_FAILED = '요청 값이 올바르지 않습니다.';

function validationBody(details: FieldError[]): ErrorBody {
  return {
    statusCode: 400,
    code: 'VALIDATION_FAILED',
    message: VALIDATION_FAILED,
    details,
  };
}

/** 알려진 오류를 오류 응답 형식으로 바꾼다. 모르는 오류는 undefined. */
function toErrorBody(exception: unknown): ErrorBody | undefined {
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
  if (exception instanceof AnchorTicketNotFoundError) {
    return {
      statusCode: 404,
      code: 'ANCHOR_TICKET_NOT_FOUND',
      message: '기준 티켓을 찾을 수 없습니다.',
    };
  }
  if (exception instanceof InvalidPositionTargetError) {
    return {
      statusCode: 400,
      code: 'INVALID_POSITION_TARGET',
      message: exception.message,
    };
  }
  if (exception instanceof InvalidTicketIdError) {
    return {
      statusCode: 400,
      code: 'INVALID_TICKET_ID',
      message: 'ticketId는 UUID 형식이어야 합니다.',
    };
  }
  if (exception instanceof ValidationFailedException) {
    return validationBody(exception.details);
  }
  if (exception instanceof DomainError) {
    return validationBody([
      { field: exception.field, reason: exception.message },
    ]);
  }
  if (exception instanceof UnsupportedMediaTypeError) {
    return {
      statusCode: 415,
      code: 'UNSUPPORTED_MEDIA_TYPE',
      message: 'Content-Type은 application/json이어야 합니다.',
    };
  }
  // Nest는 body-parser의 JSON 파싱 오류를 BadRequestException으로 감싸 던진다.
  // 이 API에서 프레임워크가 던지는 400은 본문 파싱뿐이다(검증 오류는 자체 예외를 쓴다).
  if (
    exception instanceof BadRequestException ||
    (exception as ParserError | null)?.type === 'entity.parse.failed'
  ) {
    return {
      statusCode: 400,
      code: 'INVALID_REQUEST_BODY',
      message: '요청 본문이 올바른 JSON이 아닙니다.',
    };
  }
  return undefined;
}

/**
 * 모든 오류를 HTTP 상태와 오류 코드로 변환한다. 웹 계층만 HTTP를 안다.
 * 프레임워크가 만든 오류(없는 경로 404 등)는 기본 응답을 그대로 돌려준다.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<JsonResponse>();

    const body = toErrorBody(exception);
    if (body) {
      response.status(body.statusCode).json(body);
      return;
    }
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    // 500은 트레이스에도 오류로 남긴다(계측이 꺼져 있으면 아무 일도 하지 않는다).
    const span = trace.getActiveSpan();
    span?.recordException(
      exception instanceof Error ? exception : String(exception),
    );
    span?.setStatus({ code: SpanStatusCode.ERROR });
    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    response.status(500).json({
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 내부 오류가 발생했습니다.',
    });
  }
}
