import { InvalidPositionError } from './errors';

/**
 * 컬럼 안 카드 순서를 나타내는 문자열 키. 바이트(사전) 순서로 비교한다.
 *
 * fractional indexing 방식이다(알고리즘: Rocicorp `fractional-indexing`, CC0, 라이브러리 없이 직접 구현).
 * 형식: 머리 문자 + 정수부(base62 자릿수) + 소수부(선택).
 * - `a`~`z`: 정수부 길이 2~27. 머리 문자가 커질수록 정수부가 길어져 자릿수가 늘어나는 경계에서도 사전순이 유지된다.
 * - `A`~`Z`: 음수 정수부(`Z`가 길이 2, `A`가 길이 27). 첫 키(`a0`)보다 앞에 넣기 위해 쓴다.
 * - 소수부는 `0`으로 끝날 수 없다(같은 값의 표기가 둘이 되지 않게). `A`+`0`×26은 가장 작은 키라 예약하고 쓰지 않는다.
 * 키 길이 상한은 두지 않는다(D-95).
 */
const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const ZERO = DIGITS[0]!;
const LAST_DIGIT = DIGITS[DIGITS.length - 1]!;
const SMALLEST_INTEGER = `A${ZERO.repeat(26)}`;

/** 이동 방향: 기준 카드의 앞 또는 뒤. */
export const PLACEMENTS = ['BEFORE', 'AFTER'] as const;
export type Placement = (typeof PLACEMENTS)[number];

function integerLength(head: string): number {
  if (head >= 'a' && head <= 'z') {
    return head.charCodeAt(0) - 'a'.charCodeAt(0) + 2;
  }
  if (head >= 'A' && head <= 'Z') {
    return 'Z'.charCodeAt(0) - head.charCodeAt(0) + 2;
  }
  throw new InvalidPositionError('순서 키 형식이 올바르지 않습니다.');
}

const integerPart = (key: string): string =>
  key.slice(0, integerLength(key[0]!));

/** 정수부에 1을 더한다. 더 커질 수 없으면 null. */
function incrementInteger(integer: string): string | null {
  const head = integer[0]!;
  const digits = integer.slice(1).split('');
  let carry = true;
  for (let i = digits.length - 1; carry && i >= 0; i--) {
    const next = DIGITS.indexOf(digits[i]!) + 1;
    if (next === DIGITS.length) {
      digits[i] = ZERO;
    } else {
      digits[i] = DIGITS[next]!;
      carry = false;
    }
  }
  if (!carry) {
    return head + digits.join('');
  }
  if (head === 'Z') {
    return `a${ZERO}`;
  }
  if (head === 'z') {
    return null;
  }
  const nextHead = String.fromCharCode(head.charCodeAt(0) + 1);
  if (nextHead > 'a') {
    digits.push(ZERO);
  } else {
    digits.pop();
  }
  return nextHead + digits.join('');
}

/** 정수부에서 1을 뺀다. 더 작아질 수 없으면 null. */
function decrementInteger(integer: string): string | null {
  const head = integer[0]!;
  const digits = integer.slice(1).split('');
  let borrow = true;
  for (let i = digits.length - 1; borrow && i >= 0; i--) {
    const previous = DIGITS.indexOf(digits[i]!) - 1;
    if (previous === -1) {
      digits[i] = LAST_DIGIT;
    } else {
      digits[i] = DIGITS[previous]!;
      borrow = false;
    }
  }
  if (!borrow) {
    return head + digits.join('');
  }
  if (head === 'a') {
    return `Z${LAST_DIGIT}`;
  }
  if (head === 'A') {
    return null;
  }
  const previousHead = String.fromCharCode(head.charCodeAt(0) - 1);
  if (previousHead < 'Z') {
    digits.push(LAST_DIGIT);
  } else {
    digits.pop();
  }
  return previousHead + digits.join('');
}

/** 소수부 `a`와 `b`(없으면 무한대) 사이의 소수부. 결과는 `0`으로 끝나지 않는다. */
function midpoint(a: string, b: string | null): string {
  if (b !== null && a >= b) {
    throw new InvalidPositionError('앞 키는 뒤 키보다 작아야 합니다.');
  }
  if (a.endsWith(ZERO) || (b !== null && b.endsWith(ZERO))) {
    throw new InvalidPositionError('순서 키 형식이 올바르지 않습니다.');
  }
  if (b !== null) {
    // 공통 접두사(a는 모자라는 자리를 0으로 본다)를 그대로 두고 나머지에서 중간을 찾는다.
    let common = 0;
    while ((a[common] ?? ZERO) === b[common]) {
      common++;
    }
    if (common > 0) {
      return b.slice(0, common) + midpoint(a.slice(common), b.slice(common));
    }
  }
  const digitA = a.length > 0 ? DIGITS.indexOf(a[0]!) : 0;
  const digitB = b !== null ? DIGITS.indexOf(b[0]!) : DIGITS.length;
  if (digitB - digitA > 1) {
    return DIGITS[Math.round(0.5 * (digitA + digitB))]!;
  }
  if (b !== null && b.length > 1) {
    return b.slice(0, 1);
  }
  return DIGITS[digitA]! + midpoint(a.slice(1), null);
}

function keyBetween(a: string | null, b: string | null): string {
  if (a === null) {
    if (b === null) {
      return `a${ZERO}`;
    }
    const integerB = integerPart(b);
    if (integerB < b) {
      return integerB;
    }
    const previous = decrementInteger(integerB);
    if (previous === null) {
      throw new InvalidPositionError('순서 키가 표현 범위를 넘었습니다.');
    }
    return previous;
  }
  if (b === null) {
    const integerA = integerPart(a);
    const next = incrementInteger(integerA);
    return next ?? integerA + midpoint(a.slice(integerA.length), null);
  }
  const integerA = integerPart(a);
  const integerB = integerPart(b);
  if (integerA === integerB) {
    return (
      integerA + midpoint(a.slice(integerA.length), b.slice(integerB.length))
    );
  }
  const next = incrementInteger(integerA);
  if (next === null) {
    throw new InvalidPositionError('순서 키가 표현 범위를 넘었습니다.');
  }
  if (next < b) {
    return next;
  }
  return integerA + midpoint(a.slice(integerA.length), null);
}

export class Position {
  private constructor(readonly value: string) {}

  /** 비어 있는 컬럼의 첫 카드 키. */
  static first(): Position {
    return new Position(keyBetween(null, null));
  }

  /** 저장된 값에서 복원한다. 형식에 맞지 않으면 거부한다. */
  static from(raw: string): Position {
    if (!/^[A-Za-z][0-9A-Za-z]*$/.test(raw)) {
      throw new InvalidPositionError('순서 키 형식이 올바르지 않습니다.');
    }
    const length = integerLength(raw[0]!);
    if (
      raw.length < length ||
      raw === SMALLEST_INTEGER ||
      (raw.endsWith(ZERO) && raw.length > length)
    ) {
      throw new InvalidPositionError('순서 키 형식이 올바르지 않습니다.');
    }
    return new Position(raw);
  }

  /** 컬럼의 마지막 카드 키 뒤에 오는 키. 항상 마지막 키보다 크다. */
  static after(last: Position): Position {
    return Position.between(last, null);
  }

  /**
   * 두 이웃 키 사이의 새 키. `before`가 없으면 컬럼 맨 앞, `after`가 없으면 맨 뒤,
   * 둘 다 없으면 첫 키다. 항상 `before` < 결과 < `after`이며 이웃 키는 바꾸지 않는다.
   */
  static between(before: Position | null, after: Position | null): Position {
    const a = before?.value ?? null;
    const b = after?.value ?? null;
    if (a !== null && b !== null && a >= b) {
      throw new InvalidPositionError('앞 키는 뒤 키보다 작아야 합니다.');
    }
    return new Position(keyBetween(a, b));
  }
}
