export type DomainErrorField =
  'title' | 'description' | 'priority' | 'position' | 'tags';

/** 프레임워크를 모르는 도메인 오류. HTTP 상태로의 변환은 웹 계층이 맡는다. */
export abstract class DomainError extends Error {
  abstract readonly field: DomainErrorField;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidTitleError extends DomainError {
  readonly field = 'title' as const;
}

export class InvalidDescriptionError extends DomainError {
  readonly field = 'description' as const;
}

export class InvalidPriorityError extends DomainError {
  readonly field = 'priority' as const;
}

export class InvalidPositionError extends DomainError {
  readonly field = 'position' as const;
}

export class InvalidTagsError extends DomainError {
  readonly field = 'tags' as const;
}
