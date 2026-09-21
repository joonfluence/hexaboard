import { countCharacters } from './characters';
import { InvalidTagsError } from './errors';

const MAX_NAME_LENGTH = 30;
const MAX_TAGS = 10;

/**
 * 태그 이름 목록을 정규화한다: 앞뒤 공백 제거·소문자, 정규화 뒤 중복 제거, 이름 오름차순(FR-07, D-99).
 * 빈 이름·30자 초과·정규화 뒤 10개 초과는 거부한다.
 */
export function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    throw new InvalidTagsError('태그는 문자열 배열이어야 합니다.');
  }
  const names = new Set<string>();
  for (const item of raw) {
    if (typeof item !== 'string') {
      throw new InvalidTagsError('태그 이름은 문자열이어야 합니다.');
    }
    const name = item.trim().toLowerCase();
    if (name.length === 0) {
      throw new InvalidTagsError('태그 이름은 비어 있을 수 없습니다.');
    }
    if (countCharacters(name) > MAX_NAME_LENGTH) {
      throw new InvalidTagsError(
        `태그 이름은 ${MAX_NAME_LENGTH}자 이하여야 합니다.`,
      );
    }
    names.add(name);
  }
  if (names.size > MAX_TAGS) {
    throw new InvalidTagsError(`태그는 ${MAX_TAGS}개 이하여야 합니다.`);
  }
  return [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
