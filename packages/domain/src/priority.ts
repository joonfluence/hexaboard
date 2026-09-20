import { InvalidPriorityError } from './errors';

export const PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type PriorityValue = (typeof PRIORITY_VALUES)[number];

export class Priority {
  static readonly DEFAULT = new Priority('MEDIUM');

  private constructor(readonly value: PriorityValue) {}

  /** 생략(undefined)하면 기본값이다. null이나 허용 값 밖은 거부한다. */
  static of(raw?: unknown): Priority {
    if (raw === undefined) {
      return Priority.DEFAULT;
    }
    if (
      typeof raw === 'string' &&
      (PRIORITY_VALUES as readonly string[]).includes(raw)
    ) {
      return new Priority(raw as PriorityValue);
    }
    throw new InvalidPriorityError(
      `우선순위는 ${PRIORITY_VALUES.join(', ')} 중 하나여야 합니다.`,
    );
  }
}
