'use client';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  showLabel?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export function ProgressBar({ value, max, color = 'bg-accent', showLabel = false, size = 'sm' }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const h = size === 'xs' ? 'h-[3px]' : size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-[11px] text-muted mb-1.5 tabular-nums font-[family-name:var(--font-jetbrains-mono)]">
          <span>{value.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
      <div className={`w-full ${h} bg-foreground/[0.07] rounded-full overflow-hidden`}>
        <div
          className={`${h} ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
