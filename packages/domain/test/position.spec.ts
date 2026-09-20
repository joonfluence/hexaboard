import { InvalidPositionError } from '../src/errors';
import { Position } from '../src/position';

// 문자열 순서 키는 바이트(사전) 순서로 비교한다. ASCII만 쓰므로 JS 문자열 비교와 같다.
const isAscending = (a: Position, b: Position) => a.value < b.value;

describe('Position', () => {
  it('컬럼의 첫 카드 키를 만든다', () => {
    expect(Position.first().value).toEqual(expect.any(String));
    expect(Position.first().value.length).toBeGreaterThan(0);
  });

  it('마지막 키 뒤의 키는 마지막 키보다 항상 크다', () => {
    const first = Position.first();
    expect(isAscending(first, Position.after(first))).toBe(true);
  });

  it('반복해서 추가해도 키가 단조 증가하고 중복이 없다 (자리 올림 경계 포함)', () => {
    const keys = [Position.first()];
    for (let i = 0; i < 5000; i++) {
      keys.push(Position.after(keys[keys.length - 1]!));
    }
    for (let i = 1; i < keys.length; i++) {
      expect(isAscending(keys[i - 1]!, keys[i]!)).toBe(true);
    }
    expect(new Set(keys.map((key) => key.value)).size).toBe(keys.length);
  });

  it('자리 수가 늘어나는 경계에서도 순서가 유지된다', () => {
    let key = Position.first();
    let previous = key;
    let sawLonger = false;
    for (let i = 0; i < 200; i++) {
      key = Position.after(key);
      if (key.value.length > previous.value.length) sawLonger = true;
      expect(isAscending(previous, key)).toBe(true);
      previous = key;
    }
    expect(sawLonger).toBe(true);
  });

  it('저장된 값에서 복원할 수 있다', () => {
    const key = Position.after(Position.first());
    expect(Position.from(key.value).value).toBe(key.value);
  });

  it.each(['', ' ', '0', 'A1', 'a', 'a-', 'a0!', '가나다'])(
    '형식에 맞지 않는 저장 값은 거부한다: %p',
    (raw) => {
      expect(() => Position.from(raw)).toThrow(InvalidPositionError);
    },
  );

  it('소수부가 있는 키(이동 기능이 만들 값) 뒤의 키도 그 키보다 크다', () => {
    const withFraction = Position.from('a0V');
    expect(isAscending(withFraction, Position.after(withFraction))).toBe(true);
  });
});
