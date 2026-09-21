'use client';

import { useState, type FormEvent } from 'react';
import { useCreateTicket } from '@/entities/ticket/api/queries';
import { ApiError } from '@/shared/api/errors';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/field';

function messageOf(error: unknown): string {
  if (error instanceof ApiError && error.code === 'VALIDATION_FAILED') {
    return error.details?.[0]?.reason ?? '요청 값이 올바르지 않습니다.';
  }
  return '티켓을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

/** 컬럼 하단의 인라인 입력. 제목만 받고 나머지는 상세 모달에서 편집한다(D-56). 생성은 항상 TODO다. */
export function InlineTicketForm() {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const create = useCreateTicket();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('제목을 입력해 주세요.');
      return;
    }
    setError(null);
    create.mutate(trimmed, {
      onSuccess: () => setTitle(''),
      onError: (failure) => setError(messageOf(failure)),
    });
  };

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-1.5">
      <Input
        aria-label="새 티켓 제목"
        placeholder="+ 새 티켓 제목"
        value={title}
        aria-invalid={error ? true : undefined}
        onChange={(event) => setTitle(event.target.value)}
      />
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={create.isPending} className="self-start">
        추가
      </Button>
    </form>
  );
}
