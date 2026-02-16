'use client';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="flex items-center gap-3 group disabled:opacity-50"
    >
      <div
        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${
          checked
            ? 'bg-green shadow-[0_0_12px_-2px_var(--green)]'
            : 'border-2 border-foreground/10 group-hover:border-foreground/20'
        }`}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {label && <span className="text-sm">{label}</span>}
    </button>
  );
}
