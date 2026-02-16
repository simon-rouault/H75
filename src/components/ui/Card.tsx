'use client';

import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  glass?: boolean;
  accent?: boolean;
}

export function Card({ glow = false, glass = false, accent = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`relative rounded-2xl p-5 transition-all duration-300 overflow-hidden ${
        glass
          ? 'glass'
          : glow
            ? 'bg-card border border-accent/20 shadow-[0_0_40px_-8px_var(--glow-strong)]'
            : accent
              ? 'bg-card border border-accent/10'
              : 'bg-card border border-border'
      } ${className}`}
      {...props}
    >
      {/* Top gradient line */}
      {(accent || glow) && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />
      )}
      {children}
    </div>
  );
}
