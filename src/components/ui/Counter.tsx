'use client';

import { useState, useEffect, useRef } from 'react';

/** Anime une valeur numérique de sa valeur précédente vers la cible (easeOutCubic). */
function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(target);
  const prevRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = to;

    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || from === to || !Number.isFinite(to)) { setValue(to); return; }

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export function Counter({
  value, decimals = 0, className, duration,
}: { value: number; decimals?: number; className?: string; duration?: number }) {
  const animated = useCountUp(value, duration);
  const factor = 10 ** decimals;
  const shown = (Math.round(animated * factor) / factor).toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return <span className={className}>{shown}</span>;
}
