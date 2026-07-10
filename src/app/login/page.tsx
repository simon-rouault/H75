'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Monogram } from '@/components/ui/Icon';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  async function login(userId: string) {
    if (loading) return;
    setError(false);
    setLoading(userId);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, pin }),
    });
    if (!res.ok) {
      setError(true);
      setLoading(null);
      setPin('');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  const users = [
    { id: 'simon', name: 'Simon' },
    { id: 'emma',  name: 'Emma' },
  ];

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, color-mix(in srgb,var(--accent) 8%,transparent) 0%, transparent 65%)' }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
        {/* Logo */}
        <div className="mb-12 text-center animate-fade-up">
          <div className="text-[11px] font-semibold text-muted tracking-[0.28em] uppercase mb-4">Challenge</div>
          <h1 className="font-[family-name:var(--font-playfair)] text-[80px] gradient-text leading-none tracking-tight">
            H75
          </h1>
          <div className="mt-5 w-12 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent mx-auto" />
        </div>

        {/* Subtitle */}
        <p className="text-[15px] text-foreground/40 font-medium mb-6 animate-fade-up delay-1">
          Qui continue aujourd&apos;hui ?
        </p>

        {/* Code PIN partagé */}
        <div className="w-full mb-6 animate-fade-up delay-1">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            placeholder="Code d'accès"
            className={`w-full h-12 px-4 rounded-2xl bg-card text-center text-[15px] tracking-[0.3em] outline-none transition-all shadow-[inset_0_0_0_0.5px_var(--border)] focus:shadow-[inset_0_0_0_1px_var(--accent-ring)] placeholder:tracking-normal placeholder:text-muted/30 ${error ? 'shadow-[inset_0_0_0_1px_rgba(255,69,58,0.5)]' : ''}`}
          />
          {error && <p className="text-[12px] text-red text-center mt-2">Code incorrect</p>}
        </div>

        {/* User cards */}
        <div className="flex gap-4 w-full animate-fade-up delay-2">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => login(user.id)}
              disabled={loading !== null}
              className="group relative flex-1 flex flex-col items-center gap-4 py-8 px-4 rounded-3xl bg-card border border-[var(--border)] transition-all duration-300 hover:border-accent/20 hover:bg-card-secondary active:scale-[0.97] overflow-hidden disabled:pointer-events-none"
              style={{
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Hover gradient fill */}
              <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Loading spinner overlay */}
              {loading === user.id && (
                <div className="absolute inset-0 bg-card/80 flex items-center justify-center rounded-3xl z-10">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <div className="relative group-hover:scale-105 transition-transform duration-300 ease-out">
                <Monogram name={user.name} size={64} />
              </div>
              <div className="relative text-center">
                <div className="text-[15px] font-semibold tracking-tight">{user.name}</div>
              </div>

              {/* Arrow */}
              <div className="relative text-[11px] text-accent/60 font-medium tracking-wide group-hover:text-accent transition-colors duration-200">
                Continuer →
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-16 text-[11px] text-muted/30 tracking-[0.25em] uppercase animate-fade-up delay-3">
          1 juin — 14 août 2026
        </p>
      </div>
    </div>
  );
}
