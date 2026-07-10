'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CHALLENGE_START_DATE, CHALLENGE_DAYS } from '@/lib/constants';
import { getDayNumber } from '@/lib/streak-engine';
import { today } from '@/lib/dates';

function computeStreak(logs: { date: string; completed: boolean }[]): number {
  const todayStr = today();
  const completedSet = new Set(logs.filter((l) => l.completed).map((l) => l.date));
  let running = 0;
  const d = new Date(CHALLENGE_START_DATE + 'T00:00:00');
  const end = new Date(todayStr + 'T00:00:00');
  while (d <= end) {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (completedSet.has(ds)) { running++; } else { running = 0; }
    d.setDate(d.getDate() + 1);
  }
  return running;
}

const NAV = [
  { href: '/dashboard', label: 'Objectifs', icon: HomeIcon },
  { href: '/food', label: 'Repas', icon: FoodIcon },
  { href: '/stats', label: 'Stats', icon: ChartIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { userId, userName, userEmoji } = useUser();
  const [streak, setStreak] = useState(0);
  const supabase = useMemo(() => createClient(), []);
  const dayNumber = getDayNumber(CHALLENGE_START_DATE);

  useEffect(() => {
    async function fetchData() {
      const { data: logs } = await supabase
        .from('daily_logs')
        .select('date, completed')
        .eq('user_id', userId)
        .order('date', { ascending: true });
      if (logs) setStreak(computeStreak(logs as { date: string; completed: boolean }[]));
    }
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [userId, supabase]);

  return (
    <aside
      className="hidden lg:flex flex-col w-[220px] shrink-0 border-r border-border/60 min-h-dvh fixed left-0 top-0 bottom-0 z-30"
      style={{
        background: 'color-mix(in srgb, var(--card) 85%, transparent)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <div className="flex flex-col h-full px-5 py-8">
        {/* Logo / App title */}
        <div className="mb-7">
          <div className="text-[9px] font-bold text-muted/40 tracking-[0.28em] uppercase mb-2">Challenge</div>
          <div className="font-[family-name:var(--font-playfair)] text-[22px] gradient-text leading-none">H75</div>
          <div className="text-[11px] text-muted/50 mt-2">
            Jour{' '}
            <span className="text-foreground/80 font-semibold font-[family-name:var(--font-jetbrains-mono)]">
              {dayNumber}
            </span>
            <span className="text-muted/30"> / {CHALLENGE_DAYS}</span>
          </div>
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-gradient-to-r from-accent/25 via-accent/10 to-transparent mb-5" />

        {/* Navigation */}
        <nav className="space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted/50 hover:text-foreground hover:bg-foreground/[0.05]'
                }`}
              >
                {/* Active indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-accent rounded-r-full shadow-[0_0_8px_0px_var(--accent)]" />
                )}
                <Icon active={active} />
                <span className="text-[13.5px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Streak widget */}
        {streak > 0 && (
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-accent/5 border border-accent/10 mb-3">
            <span className="text-[22px]">🔥</span>
            <div>
              <div className="font-[family-name:var(--font-jetbrains-mono)] text-[20px] font-bold gradient-text leading-none">
                {streak}
              </div>
              <div className="text-[10px] text-muted/50 mt-0.5">jours streak</div>
            </div>
          </div>
        )}

        {/* User card */}
        <div className="rounded-xl border border-border/60 bg-foreground/[0.02] p-3">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-accent/8 flex items-center justify-center text-[18px] shrink-0">
              {userEmoji}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate">{userName}</div>
              <div className="text-[10px] text-muted/40">En challenge</div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Link
              href="/profile"
              className="flex-1 text-center py-1.5 rounded-lg text-[11px] font-semibold text-muted/60 hover:text-foreground bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-border/40 transition-all duration-200"
            >
              Profil
            </Link>
            <button
              onClick={() => {
                document.cookie = '75j_user_id=;path=/;max-age=0';
                window.location.href = '/login';
              }}
              className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-muted/60 hover:text-foreground bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-border/40 transition-all duration-200"
            >
              Changer
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
    </svg>
  );
}

function FoodIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}
