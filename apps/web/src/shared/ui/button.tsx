import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

const button = cva(
  'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        ghost: 'bg-transparent text-slate-700 hover:bg-slate-200',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button>;

export function Button({
  className,
  variant,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(button({ variant }), className)}
      {...props}
    />
  );
}
