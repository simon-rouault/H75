'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent hover:bg-accent-hover text-white font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_16px_-4px_var(--glow-strong)]',
  secondary:
    'bg-foreground/[0.06] hover:bg-foreground/[0.10] text-foreground font-medium border border-[var(--border)]',
  ghost:
    'hover:bg-foreground/[0.06] text-foreground/60 hover:text-foreground font-medium',
  danger:
    'bg-red/[0.08] hover:bg-red/[0.13] text-red font-medium border border-red/10',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px] rounded-xl',
  md: 'h-11 px-5 text-[14px] rounded-xl',
  lg: 'h-[52px] px-7 text-[15px] rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center tracking-[-0.01em] transition-all duration-150 active:scale-[0.96] disabled:opacity-30 disabled:pointer-events-none select-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
);
Button.displayName = 'Button';
