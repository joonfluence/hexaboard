import { InvalidPositionError } from './errors';

/**
 * 컬럼 안 카드 순서를 나타내는 문자열 키. 바이트(사전) 순서로 비교한다.
 *
 * 형식: 머리 문자(a-z) + 정수 자릿수 + 소수부(선택). 머리 문자가 커질수록 정수 부분이 길어져
 * 자릿수가 늘어나는 경계에서도 사전순이 유지된다. 두 키 사이 계산과 키 길이 상한은
 * 카드 이동 기능에서 정한다(구현 시 확정).
 */
const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const HEAD_A = 'a'.charCodeAt(0);
const HEAD_Z = 'z'.charCodeAt(0);

const integerLength = (head: string): number => head.charCodeAt(0) - HEAD_A + 2;

export class Position {
  private constructor(readonly value: string) {}

  /** 비어 있는 컬럼의 첫 카드 키. */
  static first(): Position {
    return new Position('a0');
  }

  /** 저장된 값에서 복원한다. 형식에 맞지 않으면 거부한다. */
  static from(raw: string): Position {
    if (
      !/^[a-z][0-9A-Za-z]+$/.test(raw) ||
      raw.length < integerLength(raw[0]!)
    ) {
      throw new InvalidPositionError('순서 키 형식이 올바르지 않습니다.');
    }
    return new Position(raw);
  }

  /** 컬럼의 마지막 카드 키 뒤에 오는 키. 항상 마지막 키보다 크다. */
  static after(last: Position): Position {
    const head = last.value[0]!;
    const length = integerLength(head);
    const digits = last.value.slice(1, length).split('');

    for (let i = digits.length - 1; i >= 0; i--) {
      const next = DIGITS.indexOf(digits[i]!) + 1;
      if (next < DIGITS.length) {
        digits[i] = DIGITS[next]!;
        return new Position(head + digits.join(''));
      }
      digits[i] = DIGITS[0]!;
    }

    // 자리 올림이 정수 부분 전체를 넘었다: 머리 문자를 올리고 자릿수를 늘린다.
    const nextHeadCode = head.charCodeAt(0) + 1;
    if (nextHeadCode > HEAD_Z) {
      throw new InvalidPositionError('순서 키가 표현 범위를 넘었습니다.');
    }
    const nextHead = String.fromCharCode(nextHeadCode);
    return new Position(
      nextHead + DIGITS[0]!.repeat(integerLength(nextHead) - 1),
    );
  }
}
