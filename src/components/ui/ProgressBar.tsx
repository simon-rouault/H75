'use client';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, max, color = 'bg-accent', showLabel = false, size = 'md' }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const h = size === 'sm' ? 'h-1' : 'h-1.5';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-muted mb-1.5 font-[family-name:var(--font-jetbrains-mono)]">
          <span>{value.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
      <div className={`w-full ${h} bg-foreground/[0.06] rounded-full overflow-hidden`}>
        <div
          className={`${h} ${color} rounded-full transition-all duration-700 ease-out relative`}
          style={{
            width: `${pct}%`,
            boxShadow: pct > 5 ? `0 0 12px -2px currentColor` : 'none',
          }}
        />
      </div>
    </div>
  );
}
