import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'outline'
  | 'outline-dark'
  | 'destructive'
  | 'destructive-solid'
  | 'link';
export type ButtonSize = 'lg' | 'md' | 'sm';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white hover:brightness-[1.25]',
  accent: 'bg-brand text-white hover:brightness-[.94]',
  secondary: 'bg-line text-ink hover:brightness-[.96]',
  outline: 'bg-transparent text-brand border border-line hover:bg-canvas',
  'outline-dark': 'bg-transparent text-ink border border-ink hover:bg-canvas',
  destructive: 'bg-white text-danger border border-line hover:bg-danger-bg',
  'destructive-solid': 'bg-danger text-white hover:brightness-[.94]',
  link: 'bg-transparent text-brand p-0 hover:text-ink',
};

const SIZE: Record<ButtonSize, string> = {
  lg: 'text-[16px] px-6 py-[15px]',
  md: 'text-[15px] px-5 py-[13px]',
  sm: 'text-[13px] px-[14px] py-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    block = false,
    className,
    disabled,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-control font-semibold leading-none whitespace-nowrap transition-[filter,background-color] cursor-pointer select-none',
        VARIANT[variant],
        variant !== 'link' && SIZE[size],
        block && 'w-full',
        isDisabled && 'cursor-not-allowed opacity-55 hover:brightness-100',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
