import { countCharacters } from './characters';
import { InvalidTitleError } from './errors';

const MAX_LENGTH = 100;

export class Title {
  private constructor(readonly value: string) {}

  /** 앞뒤 공백을 제거한 값을 검증해 보관한다. */
  static of(raw: unknown): Title {
    if (raw === undefined || raw === null) {
      throw new InvalidTitleError('제목은 필수입니다.');
    }
    if (typeof raw !== 'string') {
      throw new InvalidTitleError('제목은 문자열이어야 합니다.');
    }
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new InvalidTitleError('제목은 비어 있을 수 없습니다.');
    }
    if (countCharacters(trimmed) > MAX_LENGTH) {
      throw new InvalidTitleError(`제목은 ${MAX_LENGTH}자 이하여야 합니다.`);
    }
    return new Title(trimmed);
  }
}
