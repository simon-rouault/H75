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
        <h1 className="text-[24px] font-bold tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-[12px] text-muted/60 mt-1 tracking-wide">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
