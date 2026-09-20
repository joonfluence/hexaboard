import { countCharacters } from './characters';
import { InvalidDescriptionError } from './errors';

const MAX_LENGTH = 2000;

/**
 * 없음·null·빈 문자열·공백뿐이면 null, 그 외에는 앞뒤 공백을 포함해 그대로 보존한다.
 * (앞뒤 공백 보존과 길이 검사 기준은 사용자 확인 전 가정이다. tdd-log.md 참조)
 */
export function normalizeDescription(raw: unknown): string | null {
  if (raw === undefined || raw === null) {
    return null;
  }
  if (typeof raw !== 'string') {
    throw new InvalidDescriptionError('설명은 문자열이어야 합니다.');
  }
  if (raw.trim().length === 0) {
    return null;
  }
  if (countCharacters(raw) > MAX_LENGTH) {
    throw new InvalidDescriptionError(
      `설명은 ${MAX_LENGTH}자 이하여야 합니다.`,
    );
  }
  return raw;
}
