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

describe('Position.between (004)', () => {
  const key = (raw: string) => Position.from(raw);

  it('TC-DOM-047: 양쪽이 모두 없으면 첫 키다', () => {
    expect(Position.between(null, null).value).toBe(Position.first().value);
  });

  it('TC-DOM-048: 뒤가 없으면 앞 키보다 크다', () => {
    const a = key('a5');
    const result = Position.between(a, null);
    expect(isAscending(a, result)).toBe(true);
    expect(result.value).toBe(Position.after(a).value);
  });

  it('TC-DOM-049: 앞이 없으면 뒤 키보다 작다(첫 키 앞에도 넣을 수 있고 반복해도 단조 감소한다)', () => {
    let current = Position.first();
    for (let i = 0; i < 200; i++) {
      const next = Position.between(null, current);
      expect(isAscending(next, current)).toBe(true);
      current = next;
    }
    expect(isAscending(key('a5'), key('a5'))).toBe(false);
    expect(isAscending(Position.between(null, key('a5')), key('a5'))).toBe(
      true,
    );
  });

  it.each([
    ['a0', 'a1'],
    ['a0', 'a0V'],
    ['a0V', 'a1'],
    ['a0', 'a2'],
    ['az', 'b00'],
    ['Zz', 'a0'],
    ['Zy', 'Zz'],
    ['a0G', 'a0H'],
    ['a0zz', 'a1'],
  ])('TC-DOM-050: %s와 %s 사이의 키는 두 키의 사이에 있다', (a, b) => {
    const result = Position.between(key(a), key(b));
    expect(isAscending(key(a), result)).toBe(true);
    expect(isAscending(result, key(b))).toBe(true);
  });

  it('TC-DOM-051: 같은 자리에 200번 반복 삽입해도 순서가 유지되고 중복이 없다', () => {
    const low = key('a0');
    let high = key('a1');
    const inserted: Position[] = [];
    for (let i = 0; i < 200; i++) {
      const middle = Position.between(low, high);
      expect(isAscending(low, middle)).toBe(true);
      expect(isAscending(middle, high)).toBe(true);
      inserted.push(middle);
      high = middle;
    }
    expect(new Set(inserted.map((p) => p.value)).size).toBe(200);
  });

  it.each([
    ['같음', 'a1', 'a1'],
    ['뒤집힘', 'a2', 'a1'],
  ])('TC-DOM-052: 앞 키가 뒤 키보다 %s이면 거부한다', (_label, a, b) => {
    expect(() => Position.between(key(a), key(b))).toThrow(
      InvalidPositionError,
    );
  });

  it('TC-DOM-053: 앞·뒤·중간에 무작위로 1000번 삽입해도 키 순서가 의도한 목록 순서와 같다', () => {
    // 고정 시드(mulberry32)로 재현 가능하게 한다.
    let seed = 20260921;
    const random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const list: Position[] = [];
    for (let i = 0; i < 1000; i++) {
      const index = Math.floor(random() * (list.length + 1));
      const before = index === 0 ? null : list[index - 1]!;
      const after = index === list.length ? null : list[index]!;
      list.splice(index, 0, Position.between(before, after));
    }
    for (let i = 1; i < list.length; i++) {
      expect(isAscending(list[i - 1]!, list[i]!)).toBe(true);
    }
  });

  it('TC-DOM-054: 음수 머리 키는 복원되고, 소수부 끝이 0인 키와 가장 작은 예약 키는 거부한다', () => {
    expect(Position.from('Zz').value).toBe('Zz');
    expect(() => Position.from('a00')).toThrow(InvalidPositionError);
    expect(() => Position.from(`A${'0'.repeat(26)}`)).toThrow(
      InvalidPositionError,
    );
  });

  it('TC-DOM-056: 만든 모든 키는 저장 값으로 복원할 수 있다', () => {
    const made = [
      Position.between(null, key('a0')),
      Position.between(key('a0'), key('a1')),
      Position.between(key('a0'), key('a0V')),
      Position.between(key('az'), null),
    ];
    for (const position of made) {
      expect(Position.from(position.value).value).toBe(position.value);
    }
  });
});
