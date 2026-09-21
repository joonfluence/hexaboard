/** 태그 이름 배지. 서버가 정규화한 이름을 그대로 보여 준다(FR-07). */
export function TagBadge({ name }: { name: string }) {
  return (
    <span
      data-testid="tag-badge"
      className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-800"
    >
      {name}
    </span>
  );
}
