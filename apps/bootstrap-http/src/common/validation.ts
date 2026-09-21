import { ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ValidationFailedException, type FieldError } from './http-errors';

function toFieldErrors(errors: ValidationError[]): FieldError[] {
  return errors.map((error) => ({
    field: error.property,
    reason:
      Object.values(error.constraints ?? {})[0] ?? '값이 올바르지 않습니다.',
  }));
}

/**
 * DTO(class-validator) 검증 파이프. 형식·타입 검증을 맡고 실패는 오류 응답 형식의 400으로 변환된다.
 * 정의되지 않은 필드는 제거해 무시한다(D-81).
 */
export function createBodyValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    exceptionFactory: (errors) =>
      new ValidationFailedException(toFieldErrors(errors)),
  });
}

/** 쿼리 파라미터 검증 파이프. 변환(반복 값 → 배열)을 하고 정의되지 않은 파라미터는 무시한다. */
export function createQueryValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errors) =>
      new ValidationFailedException(toFieldErrors(errors)),
  });
}
