'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

/** 모달. 접근성(포커스 가둠, Esc 닫기, 제목 연결)은 Radix가 맡는다. */
export function Dialog({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 w-[min(32rem,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-5 shadow-xl">
          <DialogPrimitive.Title className="mb-1 text-lg font-semibold">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {description}
          </DialogPrimitive.Description>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
