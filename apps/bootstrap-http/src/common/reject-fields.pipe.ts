import { Injectable, type PipeTransform } from '@nestjs/common';
import { ValidationFailedException } from './http-errors';

/**
 * 본문이 JSON 객체인지 확인하고, 보낼 수 없는 필드가 있으면 무시하지 않고 거부한다.
 * (이름이 전혀 다른 미지 필드는 여기서 다루지 않고 이후 검증 파이프가 무시한다.)
 */
@Injectable()
export class RejectFieldsPipe implements PipeTransform<unknown, unknown> {
  /** 필드 이름 → 거부 사유 */
  constructor(private readonly rules: Readonly<Record<string, string>>) {}

  transform(value: unknown): unknown {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new ValidationFailedException([
        { field: 'body', reason: '요청 본문은 JSON 객체여야 합니다.' },
      ]);
    }
    const details = Object.entries(this.rules)
      .filter(([field]) => Object.prototype.hasOwnProperty.call(value, field))
      .map(([field, reason]) => ({ field, reason }));
    if (details.length > 0) {
      throw new ValidationFailedException(details);
    }
    return value;
  }
}
