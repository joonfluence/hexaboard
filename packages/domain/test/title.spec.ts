import { InvalidTitleError } from '../src/errors';
import { Title } from '../src/title';

describe('Title', () => {
  it('보관하는 값은 앞뒤 공백을 제거한 값이다 (C3)', () => {
    expect(Title.of('  문서 정리  ').value).toBe('문서 정리');
  });

  it.each([undefined, null, '', '   ', '\n\t '])(
    '비어 있거나 공백뿐이거나 없는 제목은 거부한다: %p (V1)',
    (raw) => {
      expect(() => Title.of(raw)).toThrow(InvalidTitleError);
    },
  );

  it('문자열이 아닌 값은 거부한다', () => {
    expect(() => Title.of(123)).toThrow(InvalidTitleError);
  });

  it('정확히 100자는 허용한다 (C5)', () => {
    expect(Title.of('가'.repeat(100)).value).toHaveLength(100);
  });

  it('101자는 거부한다 (V2)', () => {
    expect(() => Title.of('가'.repeat(101))).toThrow(InvalidTitleError);
  });

  it('앞뒤 공백 때문에 100자를 넘어도 제거 후 100자 이하면 허용한다', () => {
    expect(Title.of(`  ${'가'.repeat(100)}  `).value).toBe('가'.repeat(100));
  });

  it('길이는 UTF-16 코드 유닛이 아니라 문자(코드 포인트) 수로 센다', () => {
    expect(() => Title.of('😀'.repeat(100))).not.toThrow();
    expect(() => Title.of('😀'.repeat(101))).toThrow(InvalidTitleError);
  });

  it('오류는 어느 필드의 오류인지 알려 준다', () => {
    try {
      Title.of('');
      throw new Error('should not reach');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTitleError);
      expect((error as InvalidTitleError).field).toBe('title');
    }
  });
});
