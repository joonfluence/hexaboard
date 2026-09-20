/** 같은 컬럼에서 순서 키가 충돌했다. (상태, 순서 키) 유니크 제약을 어겼을 때 저장소가 던진다. */
export class PositionConflictError extends Error {
  constructor(message = '순서 키가 충돌했습니다.') {
    super(message);
    this.name = 'PositionConflictError';
  }
}
