'use client';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 pt-3">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-[32px] font-semibold tracking-tight leading-[1.05]">{title}</h1>
        {subtitle && <p className="text-[12px] text-muted/60 mt-1.5 tracking-wide">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
