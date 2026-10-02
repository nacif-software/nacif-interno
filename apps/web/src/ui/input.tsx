import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

export const controlClass =
  'w-full rounded-control border border-line bg-white px-[14px] py-[13px] text-[16px] leading-[1.5] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none disabled:bg-canvas disabled:opacity-70 aria-invalid:border-danger';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(controlClass, className)} {...rest} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return (
    <textarea ref={ref} className={cn(controlClass, 'min-h-24 resize-y', className)} {...rest} />
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, placeholder, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(controlClass, 'appearance-none pr-10', className)} {...rest}>
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-ink-muted"
      />
    </div>
  );
});

export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  suffix?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { className, suffix, ...rest },
  ref,
) {
  return (
    <div className="flex items-center gap-3">
      <input
        ref={ref}
        type="number"
        inputMode="numeric"
        className={cn(controlClass, 'w-[88px] font-mono text-[16px]', className)}
        {...rest}
      />
      {suffix && <span className="text-[15px] text-ink-muted">{suffix}</span>}
    </div>
  );
});
