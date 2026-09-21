'use client';

import type {
  Ticket,
  TicketPriority,
  UpdateTicketBody,
} from '@todo/api-client';
import { useState } from 'react';
import {
  useDeleteTicket,
  useTicketsQuery,
  useUpdateTicket,
} from '@/entities/ticket/api/queries';
import { PRIORITIES, priorityLabel } from '@/entities/ticket/model/priority';
import { ApiError } from '@/shared/api/errors';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Field, Input, Select, Textarea } from '@/shared/ui/field';

/** ISO 시각을 `datetime-local` 입력값(브라우저 시간대)으로 바꾼다. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const two = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`;
}

type FieldErrors = Partial<
  Record<'title' | 'description' | 'priority' | 'dueAt' | 'tags', string>
>;

function EditForm({
  ticket,
  onClose,
}: {
  ticket: Ticket;
  onClose: () => void;
}) {
  const initialDue = toLocalInput(ticket.dueAt);
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description ?? '');
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority);
  const [dueAt, setDueAt] = useState(initialDue);
  const [tags, setTags] = useState<string[]>([...ticket.tags]);
  const [tagText, setTagText] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const update = useUpdateTicket();
  const remove = useDeleteTicket();

  /** 바뀐 필드만 모은다. 상태와 순서는 여기서 바꾸지 않는다(이동으로만 바꾼다). */
  const changes = (): UpdateTicketBody => {
    const body: UpdateTicketBody = {};
    if (title !== ticket.title) body.title = title;
    const nextDescription = description.trim() === '' ? null : description;
    if (nextDescription !== ticket.description)
      body.description = nextDescription;
    if (priority !== ticket.priority) body.priority = priority;
    if (dueAt !== initialDue) {
      body.dueAt = dueAt === '' ? null : new Date(dueAt).toISOString();
    }
    const nextTags = [...tags].sort();
    if (JSON.stringify(nextTags) !== JSON.stringify(ticket.tags)) {
      body.tags = nextTags;
    }
    return body;
  };

  /** 화면에서 미리 정규화(공백 제거·소문자)해 추가한다. 최종 이름은 서버가 정한다. */
  const addTag = () => {
    const name = tagText.trim().toLowerCase();
    if (name && !tags.includes(name)) {
      setTags([...tags, name]);
    }
    setTagText('');
  };

  const save = () => {
    const body = changes();
    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }
    setErrors({});
    setFailure(null);
    update.mutate(
      { ticketId: ticket.ticketId, body },
      {
        onSuccess: onClose,
        onError: (error) => {
          if (error instanceof ApiError && error.code === 'VALIDATION_FAILED') {
            const next: FieldErrors = {};
            for (const detail of error.details ?? []) {
              next[detail.field as keyof FieldErrors] = detail.reason;
            }
            setErrors(next);
            return;
          }
          setFailure('저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        },
      },
    );
  };

  const describedBy = (field: keyof FieldErrors) =>
    errors[field] ? `${field}-error` : undefined;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Field label="제목" htmlFor="title" error={errors.title}>
        <Input
          id="title"
          value={title}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={describedBy('title')}
          onChange={(event) => setTitle(event.target.value)}
        />
      </Field>
      <Field label="설명" htmlFor="description" error={errors.description}>
        <Textarea
          id="description"
          value={description}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={describedBy('description')}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>
      <Field label="우선순위" htmlFor="priority" error={errors.priority}>
        <Select
          id="priority"
          value={priority}
          onChange={(event) =>
            setPriority(event.target.value as TicketPriority)
          }
        >
          {PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {priorityLabel(value)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="마감일" htmlFor="dueAt" error={errors.dueAt}>
        <Input
          id="dueAt"
          type="datetime-local"
          value={dueAt}
          aria-invalid={errors.dueAt ? true : undefined}
          aria-describedby={describedBy('dueAt')}
          onChange={(event) => setDueAt(event.target.value)}
        />
      </Field>

      <Field label="태그" htmlFor="tag-input" error={errors.tags}>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-800"
            >
              {name}
              <button
                type="button"
                aria-label={`${name} 제거`}
                onClick={() => setTags(tags.filter((tag) => tag !== name))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            id="tag-input"
            value={tagText}
            aria-invalid={errors.tags ? true : undefined}
            onChange={(event) => setTagText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addTag();
              }
            }}
          />
          <Button variant="ghost" onClick={addTag}>
            태그 추가
          </Button>
        </div>
      </Field>

      {failure ? (
        <p role="alert" className="text-sm text-red-600">
          {failure}
        </p>
      ) : null}

      {confirming ? (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-2">
          <span className="text-sm">정말 삭제할까요?</span>
          <Button
            variant="danger"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(ticket.ticketId, {
                onSuccess: onClose,
                onError: () =>
                  setFailure(
                    '삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.',
                  ),
              })
            }
          >
            삭제 확인
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            취소
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setConfirming(true)}>
            삭제
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              닫기
            </Button>
            <Button type="submit" disabled={update.isPending}>
              저장
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

/** 카드 상세 보기·편집 모달. 명시적 "저장" 버튼으로 저장하고 삭제는 확인 단계를 거친다(D-96). */
export function TicketDetailModal({
  ticketId,
  onClose,
}: {
  ticketId: string;
  onClose: () => void;
}) {
  const { data } = useTicketsQuery();
  const ticket = data?.find((item) => item.ticketId === ticketId);
  if (!ticket) return null;
  return (
    <Dialog
      title="티켓 상세"
      description="티켓의 내용을 수정하거나 삭제합니다."
      onClose={onClose}
    >
      <EditForm key={ticket.ticketId} ticket={ticket} onClose={onClose} />
    </Dialog>
  );
}
