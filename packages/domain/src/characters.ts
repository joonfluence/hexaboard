/** 길이는 UTF-16 코드 유닛이 아니라 문자(코드 포인트) 수로 센다. DB의 문자 길이 제한과 같은 기준이다. */
export function countCharacters(value: string): number {
  return Array.from(value).length;
}
