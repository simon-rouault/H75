'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './Button';

interface TimerProps {
  targetMinutes: number;
  onSave: (minutes: number) => void;
  initialMinutes?: number;
}

export function Timer({ targetMinutes, onSave, initialMinutes = 0 }: TimerProps) {
  const [seconds, setSeconds] = useState(initialMinutes * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setRunning(true);
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }, []);

  const pause = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const save = useCallback(() => {
    pause();
    onSave(Math.round(seconds / 60));
  }, [pause, onSave, seconds]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = Math.min((mins / targetMinutes) * 100, 100);

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className={`font-[family-name:var(--font-jetbrains-mono)] text-4xl font-bold tabular-nums tracking-tight ${running ? 'gradient-text' : ''}`}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
      <div className="w-full h-1.5 bg-foreground/[0.06] rounded-full overflow-hidden">
        <div className="h-full bg-blue rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2">
        {!running ? (
          <Button size="sm" onClick={start}>Start</Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={pause}>Pause</Button>
        )}
        {seconds > 0 && <Button size="sm" variant="secondary" onClick={save}>Sauvegarder</Button>}
      </div>
    </div>
  );
}
