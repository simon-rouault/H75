'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { CHALLENGE_START_DATE, CHALLENGE_DAYS, GOALS } from '@/lib/constants';
import { daysArray, today } from '@/lib/dates';
import { isWorkoutDone, computeStreaks } from '@/lib/streak-engine';
import { createClient } from '@/lib/supabase/client';
import { Icon, type IconName } from '@/components/ui/Icon';
import type { DailyLog } from '@/types/database';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getElapsedDays(startDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const now = new Date(today() + 'T00:00:00');
  return Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

// Adhérence par habitude quotidienne : % de jours écoulés où l'habitude est tenue.
const DAILY_HABITS: { label: string; icon: IconName; test: (l: DailyLog) => boolean }[] = [
  { label: 'Eau',            icon: 'droplet',    test: l => l.water_ml >= GOALS.water_ml.target },
  { label: 'Pas',            icon: 'footprints', test: l => l.steps >= GOALS.steps.target },
  { label: 'Sport',          icon: 'dumbbell',   test: l => isWorkoutDone(l.workout_count) },
  { label: 'Objectif perso', icon: 'sparkle',    test: l => l.stretching || l.reinforcement },
  { label: 'Lecture',        icon: 'book',       test: l => l.pages >= GOALS.pages.target },
];

function habitAdherence(logs: DailyLog[], elapsed: number) {
  return DAILY_HABITS.map(h => {
    const count = logs.filter(h.test).length;
    const pct = elapsed > 0 ? Math.round((count / elapsed) * 100) : 0;
    return { label: h.label, icon: h.icon, count, pct };
  });
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-1 mb-2.5 mt-6 first:mt-0">
      <span className="text-[11px] font-semibold text-muted/50 tracking-[0.16em] uppercase">{children}</span>
    </div>
  );
}

const CARD = 'bg-card rounded-3xl shadow-[inset_0_0_0_0.5px_var(--border)]';

// ─── Hero streak ───────────────────────────────────────────────────────────────

function HeroStreak({ current, best, rate, completed, elapsed, won }: {
  current: number; best: number; rate: number; completed: number; elapsed: number; won: boolean;
}) {
  return (
    <div className={`${CARD} p-6 text-center`}>
      <div className="text-[10px] font-semibold text-muted/50 tracking-[0.2em] uppercase mb-1">Streak actuel</div>
      <div className="font-[family-name:var(--font-playfair)] text-[68px] gradient-text leading-[0.9] tracking-tight">{current}</div>
      <div className="text-[13px] text-foreground/55 font-medium mt-1.5 flex items-center justify-center gap-1.5">
        <span className="text-accent"><Icon name="flame" size={14} fill stroke={1} /></span>
        {current > 1 ? "jours d'affilée" : current === 1 ? "1 jour d'affilée" : 'lance ton streak aujourd’hui'}
      </div>
      {won && (
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green/[0.12] shadow-[inset_0_0_0_0.5px_rgba(48,209,88,0.28)] text-green">
          <Icon name="trophy" size={13} stroke={2.2} /><span className="text-[12px] font-bold">Défi réussi</span>
        </div>
      )}
      <div className="grid grid-cols-3 divide-x divide-[var(--separator)] mt-5 pt-4 border-t border-[var(--separator)]">
        {[
          { label: 'Meilleur', value: best, sub: 'jours' },
          { label: 'Réussite', value: `${rate}%`, sub: `${completed}/${elapsed}` },
          { label: 'Complétés', value: completed, sub: `sur ${elapsed}` },
        ].map(s => (
          <div key={s.label} className="px-1">
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-[22px] font-bold leading-none">{s.value}</div>
            <div className="text-[10px] text-muted/50 mt-1.5 tracking-wide uppercase">{s.label}</div>
            <div className="text-[10px] text-muted/35 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Adherence bars ────────────────────────────────────────────────────────────

function AdherenceCard({ items }: { items: { label: string; icon: IconName; count: number; pct: number }[] }) {
  return (
    <div className={`${CARD} p-5 space-y-4`}>
      {items.map(h => {
        const color = h.pct >= 80 ? 'var(--green)' : h.pct >= 50 ? 'var(--accent)' : 'var(--red)';
        return (
          <div key={h.label} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-foreground/[0.05] flex items-center justify-center text-muted shrink-0">
              <Icon name={h.icon} size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[13px] font-medium">{h.label}</span>
                <span className="font-[family-name:var(--font-jetbrains-mono)] text-[12px] font-bold" style={{ color }}>
                  {h.pct}%<span className="text-muted/35 font-normal ml-1.5">{h.count}j</span>
                </span>
              </div>
              <div className="w-full h-[6px] bg-foreground/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${h.pct}%`, background: color }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Calendar Grid ─────────────────────────────────────────────────────────────

function CalendarGrid({ logs, startDate }: { logs: DailyLog[]; startDate: string }) {
  const days = daysArray(startDate, Math.max(CHALLENGE_DAYS, getElapsedDays(startDate)));
  const logMap = new Map(logs.map(l => [l.date, l]));
  const todayStr = today();
  const firstDay = new Date(startDate + 'T00:00:00').getDay();
  const padDays = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {['L','M','M','J','V','S','D'].map((d, i) => (
          <div key={i} className="text-[10px] text-muted/35 text-center font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: padDays }).map((_, i) => <div key={`p${i}`} className="aspect-square" />)}
        {days.map(date => {
          const log = logMap.get(date);
          const isFuture = date > todayStr;
          const isCompleted = log?.completed;
          const isToday = date === todayStr;
          let bg = 'bg-foreground/[0.04]';
          if (isToday) bg = isCompleted ? 'bg-green' : 'bg-accent/40';
          else if (!isFuture) bg = isCompleted ? 'bg-green' : 'bg-red/30';
          return (
            <div key={date}
              className={`aspect-square rounded-[5px] transition-all ${bg} ${isToday ? 'ring-[1.5px] ring-accent ring-offset-[1.5px] ring-offset-card' : ''}`}
              title={`${date}: ${isCompleted ? 'Complété' : isToday ? 'En cours' : isFuture ? 'À venir' : 'Manqué'}`}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-muted/50 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-green inline-block" /> Complété</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-accent/40 inline-block" /> Aujourd&apos;hui</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-red/30 inline-block" /> Manqué</span>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { userId } = useUser();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('date', CHALLENGE_START_DATE)
        .order('date', { ascending: true });
      setLogs((data ?? []) as DailyLog[]);
    }
    fetchData();
  }, [supabase, userId]);

  const elapsed = getElapsedDays(CHALLENGE_START_DATE);
  const completedDays = logs.filter(l => l.completed).length;
  const successRate = elapsed > 0 ? Math.round((completedDays / elapsed) * 100) : 0;
  const streaks = computeStreaks(logs, CHALLENGE_START_DATE);
  const adherence = habitAdherence(logs, elapsed);

  return (
    <div className="pb-2">

      {/* Page title */}
      <div className="pt-6 pb-2 animate-fade-up">
        <h1 className="font-[family-name:var(--font-playfair)] text-[32px] font-semibold leading-[1.05] tracking-tight">
          Statistiques
        </h1>
      </div>

      <div className="animate-fade-up delay-1">
        <SectionLabel>Vue d&apos;ensemble</SectionLabel>
        <HeroStreak
          current={streaks.current} best={streaks.best} rate={successRate}
          completed={completedDays} elapsed={elapsed} won={streaks.best >= CHALLENGE_DAYS}
        />

        <SectionLabel>Régularité par habitude</SectionLabel>
        <AdherenceCard items={adherence} />

        <SectionLabel>Calendrier du challenge</SectionLabel>
        <div className={`${CARD} p-5`}>
          <CalendarGrid logs={logs} startDate={CHALLENGE_START_DATE} />
        </div>
      </div>
    </div>
  );
}
