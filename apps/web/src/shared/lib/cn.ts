import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind 클래스를 조건부로 합치고 충돌을 정리한다(shadcn/ui 관례). */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
