const two = (value: number) => String(value).padStart(2, '0');

/** 마감일을 `M월 D일 HH:mm`(브라우저 시간대)로 바꾸고 지났는지 알려 준다. 서버는 UTC로 준다(FR-05). */
export function formatDueAt(
  iso: string,
  now: Date = new Date(),
): { text: string; overdue: boolean } {
  const due = new Date(iso);
  return {
    text: `${due.getMonth() + 1}월 ${due.getDate()}일 ${two(due.getHours())}:${two(due.getMinutes())}`,
    overdue: due.getTime() < now.getTime(),
  };
}
