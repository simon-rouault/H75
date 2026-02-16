'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.1em] mb-2">{label}</label>}
      <input
        ref={ref}
        className={`w-full bg-foreground/[0.04] border border-border/80 rounded-xl px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 focus:bg-accent-soft transition-all duration-200 ${className}`}
        {...props}
      />
    </div>
  )
);
Input.displayName = 'Input';
