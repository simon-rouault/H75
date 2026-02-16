'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent hover:bg-accent-hover text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_20px_-4px_var(--glow-strong)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_28px_-4px_var(--glow-strong)]',
  secondary: 'bg-foreground/[0.05] hover:bg-foreground/[0.08] text-foreground border border-foreground/[0.08] hover:border-foreground/[0.12]',
  ghost: 'hover:bg-foreground/[0.05] text-muted hover:text-foreground',
  danger: 'bg-red/8 hover:bg-red/12 text-red border border-red/10',
};

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-[13px] rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-[15px] rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={`font-semibold tracking-[-0.01em] transition-all duration-200 active:scale-[0.96] disabled:opacity-30 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
);
Button.displayName = 'Button';
