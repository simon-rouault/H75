'use client';

import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  async function login(userId: string) {
    await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Big ambient glow */}
      <div className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(255,107,44,0.25) 0%, rgba(255,107,44,0) 70%)' }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.2) 0%, transparent 70%)' }} />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
        {/* Badge */}
        <div className="mb-10 px-5 py-2 rounded-full border border-accent/20 bg-accent/5 text-[10px] font-bold text-accent uppercase tracking-[0.3em]">
          Challenge
        </div>

        {/* Title */}
        <h1 className="font-[family-name:var(--font-dela-gothic)] text-7xl sm:text-8xl gradient-text mb-3 text-center leading-none">
          75
        </h1>
        <h2 className="font-[family-name:var(--font-dela-gothic)] text-xl sm:text-2xl text-foreground/60 mb-2 text-center tracking-[0.3em] uppercase">
          Jours
        </h2>
        <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent mb-16" />
        <p className="text-muted text-[15px] mb-12 tracking-wide">Qui es-tu ?</p>

        {/* User cards */}
        <div className="flex gap-6 w-full justify-center">
          {[
            { id: 'simon', name: 'Simon', emoji: '🦁' },
            { id: 'emma', name: 'Emma', emoji: '🦊' },
          ].map((user) => (
            <button
              key={user.id}
              onClick={() => login(user.id)}
              className="group relative flex flex-col items-center gap-6 p-10 rounded-3xl bg-card border border-border transition-all duration-500 hover:border-accent/30 hover:shadow-[0_0_60px_-10px_var(--glow-strong)] active:scale-[0.97] w-full max-w-[180px] overflow-hidden"
            >
              {/* Hover glow inside card */}
              <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative text-6xl sm:text-7xl group-hover:scale-110 transition-transform duration-500 ease-out">{user.emoji}</span>
              <span className="relative text-[15px] font-semibold tracking-wide">{user.name}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-20 text-[10px] text-muted/30 font-medium tracking-[0.3em] uppercase">
          Simon & Emma — 2026
        </p>
      </div>
    </div>
  );
}
