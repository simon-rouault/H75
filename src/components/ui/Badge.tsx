'use client';

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-foreground/[0.06] text-muted',
  success: 'bg-green/10 text-green',
  danger: 'bg-red/10 text-red',
  warning: 'bg-yellow/10 text-yellow',
  info: 'bg-blue/10 text-blue',
};

export function Badge({ variant = 'default', children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${variants[variant]}`}>
      {children}
    </span>
  );
}
