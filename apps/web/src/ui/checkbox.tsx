import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** A marca (✓) fica em `.checkbox-mark` no theme.css: uma URL de SVG numa classe arbitrária quebraria no scanner. */
export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Checkbox({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'checkbox-mark size-4 shrink-0 cursor-pointer appearance-none rounded-check border border-line bg-white checked:border-brand checked:bg-brand disabled:cursor-default',
          className,
        )}
        {...rest}
      />
    );
  },
);
