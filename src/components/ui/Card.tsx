'use client';

import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'inset' | 'accent' | 'elevated';
  /** @deprecated use variant="accent" */
  glow?: boolean;
  /** @deprecated use className directly */
  glass?: boolean;
  /** @deprecated use variant="accent" */
  accent?: boolean;
}

export function Card({
  variant = 'default',
  glow,
  glass,
  accent,
  className = '',
  children,
  ...props
}: CardProps) {
  // Legacy compat
  const resolvedVariant = glow || accent ? 'accent' : glass ? 'elevated' : variant;

  const base = 'relative rounded-3xl transition-all duration-200 overflow-hidden';

  const styles: Record<string, string> = {
    default:
      'bg-card p-5 shadow-[inset_0_0_0_0.5px_var(--border)]',
    elevated:
      'bg-card-secondary p-5 shadow-[inset_0_0_0_0.5px_var(--border),var(--shadow-md)]',
    accent:
      'bg-card p-5 shadow-[inset_0_0_0_0.5px_rgba(255,107,44,0.20),0_0_40px_-8px_var(--glow-strong)]',
    inset:
      'bg-foreground/[0.04] rounded-2xl p-4 shadow-[inset_0_0_0_0.5px_var(--separator)]',
  };

  return (
    <div className={`${base} ${styles[resolvedVariant]} ${className}`} {...props}>
      {resolvedVariant === 'accent' && (
        <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      )}
      {children}
    </div>
  );
}
