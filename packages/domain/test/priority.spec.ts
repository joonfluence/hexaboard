import { InvalidPriorityError } from '../src/errors';
import { Priority } from '../src/priority';

describe('Priority', () => {
  it.each(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])('%s를 허용한다', (raw) => {
    expect(Priority.of(raw).value).toBe(raw);
  });

  it('생략하면 기본값 MEDIUM이다 (C1)', () => {
    expect(Priority.of(undefined).value).toBe('MEDIUM');
    expect(Priority.DEFAULT.value).toBe('MEDIUM');
  });

  it.each([null, 'low', 'CRITICAL', '', 3])(
    '허용 값이 아니거나 null이면 거부한다: %p (V3)',
    (raw) => {
      expect(() => Priority.of(raw)).toThrow(InvalidPriorityError);
    },
  );

  it('오류는 priority 필드의 오류다', () => {
    try {
      Priority.of(null);
      throw new Error('should not reach');
    } catch (error) {
      expect((error as InvalidPriorityError).field).toBe('priority');
    }
  });
});
