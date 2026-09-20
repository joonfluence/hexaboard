import { InvalidDescriptionError } from '../src/errors';
import { normalizeDescription } from '../src/description';

describe('normalizeDescription', () => {
  it.each([undefined, null, '', '   ', '\n\t '])(
    '없음·null·빈 문자열·공백뿐이면 null이다: %p (C4)',
    (raw) => {
      expect(normalizeDescription(raw)).toBeNull();
    },
  );

  // 가정(사용자 확인 전 기본 제안): 앞뒤 공백을 다듬지 않고 그대로 저장한다.
  it('내용이 있으면 앞뒤 공백을 포함해 그대로 보존한다', () => {
    expect(normalizeDescription('  내용\n두 번째 줄  ')).toBe(
      '  내용\n두 번째 줄  ',
    );
  });

  it('정확히 2000자는 허용한다 (C5)', () => {
    expect(normalizeDescription('가'.repeat(2000))).toHaveLength(2000);
  });

  it('2001자는 거부한다 (V2)', () => {
    expect(() => normalizeDescription('가'.repeat(2001))).toThrow(
      InvalidDescriptionError,
    );
  });

  it('문자열이 아닌 값은 거부한다', () => {
    expect(() => normalizeDescription(123)).toThrow(InvalidDescriptionError);
  });

  it('오류는 description 필드의 오류다', () => {
    try {
      normalizeDescription('가'.repeat(2001));
      throw new Error('should not reach');
    } catch (error) {
      expect((error as InvalidDescriptionError).field).toBe('description');
    }
  });
});
