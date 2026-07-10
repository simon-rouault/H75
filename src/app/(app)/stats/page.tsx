'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { CHALLENGE_START_DATE, CHALLENGE_DAYS } from '@/lib/constants';
import { daysArray, today } from '@/lib/dates';
import { createClient } from '@/lib/supabase/client';
import type { DailyLog } from '@/types/database';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function computeStreaks(logs: { date: string; completed: boolean }[], startDate: string): { current: number; best: number } {
  const todayStr = today();
  const completedSet = new Set(logs.filter(l => l.completed).map(l => l.date));
  let best = 0, streak = 0;
  const d = new Date(startDate + 'T00:00:00');
  const end = new Date(todayStr + 'T00:00:00');
  while (d <= end) {
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    completedSet.has(ds) ? (streak++, streak > best && (best = streak)) : (streak = 0);
    d.setDate(d.getDate() + 1);
  }
  return { current: streak, best };
}

function getElapsedDays(startDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const now = new Date(today() + 'T00:00:00');
  return Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

interface Aggregates { sports: number; waterL: number; steps: number; pages: number; }

function computeAggregates(logs: DailyLog[]): Aggregates {
  const t = logs.reduce(
    (a, l) => ({
      sports: a.sports + Math.max(l.workout_count || 0, 0),
      waterMl: a.waterMl + (l.water_ml || 0),
      steps: a.steps + (l.steps || 0),
      pages: a.pages + (l.pages || 0),
    }),
    { sports: 0, waterMl: 0, steps: 0, pages: 0 }
  );
  return { sports: t.sports, waterL: Math.round(t.waterMl / 100) / 10, steps: t.steps, pages: t.pages };
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-1 mb-2 mt-5 first:mt-0">
      <span className="text-[11px] font-semibold text-muted/50 tracking-[0.16em] uppercase">{children}</span>
    </div>
  );
}

// ─── Calendar Grid ─────────────────────────────────────────────────────────────

function CalendarGrid({ logs, startDate }: { logs: DailyLog[]; startDate: string }) {
  // At least 75 days, but keep extending as the habit continues past the challenge.
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

// ─── Dual Calendar ─────────────────────────────────────────────────────────────

function DualCalendar({ simonLogs, emmaLogs, startDate }: {
  simonLogs: { date: string; completed: boolean }[];
  emmaLogs: { date: string; completed: boolean }[];
  startDate: string;
}) {
  const days = daysArray(startDate, Math.max(CHALLENGE_DAYS, getElapsedDays(startDate)));
  const todayStr = today();
  const sMap = new Map(simonLogs.map(l => [l.date, l.completed]));
  const eMap = new Map(emmaLogs.map(l => [l.date, l.completed]));
  const firstDay = new Date(startDate + 'T00:00:00').getDay();
  const padDays = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-[11px] text-muted/60">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-[3px] bg-accent" /> Simon 🦁</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-[3px] bg-blue" /> Emma 🦊</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-[3px] bg-green" /> Les deux</div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {['L','M','M','J','V','S','D'].map((d, i) => (
          <div key={i} className="text-[10px] text-muted/35 text-center font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: padDays }).map((_, i) => <div key={`p${i}`} className="aspect-square" />)}
        {days.map(date => {
          const isFuture = date > todayStr;
          const s = sMap.get(date) ?? false;
          const e = eMap.get(date) ?? false;
          let bg = 'bg-foreground/[0.04]';
          if (!isFuture) {
            if (s && e) bg = 'bg-green';
            else if (s) bg = 'bg-accent/60';
            else if (e) bg = 'bg-blue/60';
            else bg = 'bg-red/25';
          }
          return (
            <div key={date}
              className={`aspect-square rounded-[5px] transition-all ${bg}`}
              title={`${date}: Simon ${s ? '✓' : '✗'} | Emma ${e ? '✓' : '✗'}`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Big stat block ────────────────────────────────────────────────────────────

function StatBlock({ label, value, sub, color = 'text-green' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-5">
      <div className="text-[10px] font-semibold text-muted/50 tracking-[0.14em] uppercase mb-1.5">{label}</div>
      <div className={`font-[family-name:var(--font-jetbrains-mono)] text-[32px] font-bold leading-none ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted/50 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Rival card ────────────────────────────────────────────────────────────────

function RivalCard({ name, emoji, streak, completed, rate, todayStatus, isLeading }: {
  name: string; emoji: string; streak: number; completed: number; rate: number;
  todayStatus: 'done' | 'missed' | 'ongoing'; isLeading: boolean;
}) {
  const statusIcon = todayStatus === 'done' ? '✅' : todayStatus === 'ongoing' ? '⏳' : '🔴';

  return (
    <div className={`flex-1 rounded-3xl p-4 transition-all ${
      isLeading
        ? 'bg-card shadow-[inset_0_0_0_0.5px_color-mix(in srgb,var(--accent) 20%,transparent),0_0_40px_-8px_var(--glow-strong)]'
        : 'bg-card shadow-[inset_0_0_0_0.5px_var(--border)]'
    }`}>
      {isLeading && <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-accent/35 to-transparent" />}
      <div className="relative flex items-center gap-2.5 mb-4">
        <div className="text-[28px]">{isLeading ? '👑' : emoji}</div>
        <div>
          <div className="text-[15px] font-bold">{name}</div>
          <div className="text-[11px] text-muted/60">{statusIcon}</div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-muted/60">Streak</span>
          <span className={`font-[family-name:var(--font-jetbrains-mono)] text-[20px] font-bold ${isLeading ? 'gradient-text' : ''}`}>{streak}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-muted/60">Jours ✓</span>
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-[16px] font-bold text-green">{completed}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-muted/60">Taux</span>
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-[16px] font-bold">{rate}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Weight chart ──────────────────────────────────────────────────────────────

function WeightChart({ userId }: { userId: string }) {
  const [data, setData] = useState<{ date: string; weight_kg: number }[]>([]);

  useEffect(() => {
    fetch(`/api/weight?userId=${userId}&all=true`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setData((d as { date: string; weight_kg: number }[]).sort((a, b) => a.date.localeCompare(b.date))));
  }, [userId]);

  if (data.length < 2) return null;

  const W = 300, H = 80;
  const weights = data.map(d => d.weight_kg);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const n = data.length;
  const toX = (i: number) => (i / (n - 1)) * W;
  const toY = (w: number) => H - ((w - minW) / (maxW - minW)) * H;
  const points = data.map((d, i) => `${toX(i).toFixed(1)},${toY(d.weight_kg).toFixed(1)}`).join(' ');
  const first = data[0].weight_kg;
  const last = data[data.length - 1].weight_kg;
  const diff = last - first;

  return (
    <div className="bg-card rounded-3xl p-5 shadow-[inset_0_0_0_0.5px_var(--border)]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] font-semibold">Évolution du poids</span>
        <span className={`font-[family-name:var(--font-jetbrains-mono)] text-[14px] font-bold ${diff < 0 ? 'text-green' : diff > 0 ? 'text-red' : 'text-muted/50'}`}>
          {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 64 }}>
        <defs>
          <linearGradient id="wline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <polyline points={points} fill="none" stroke="url(#wline)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.weight_kg)} r="2.5" fill="var(--accent)" />
        ))}
      </svg>
      <div className="flex justify-between text-[11px] text-muted/50 mt-2">
        <span>{data[0].date.slice(5)}</span>
        <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] font-semibold text-foreground">{last} kg</span>
        <span>{data[data.length - 1].date.slice(5)}</span>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { userId } = useUser();
  const [tab, setTab] = useState<'stats' | 'rival'>('stats');
  const [simonLogs, setSimonLogs] = useState<DailyLog[]>([]);
  const [emmaLogs, setEmmaLogs] = useState<DailyLog[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      // Only count days from the challenge restart onward.
      const [{ data: sLogs }, { data: eLogs }] = await Promise.all([
        supabase.from('daily_logs').select('*').eq('user_id', 'simon').gte('date', CHALLENGE_START_DATE).order('date', { ascending: true }),
        supabase.from('daily_logs').select('*').eq('user_id', 'emma').gte('date', CHALLENGE_START_DATE).order('date', { ascending: true }),
      ]);
      setSimonLogs((sLogs ?? []) as DailyLog[]);
      setEmmaLogs((eLogs ?? []) as DailyLog[]);
    }
    fetchData();
  }, [supabase]);

  const myLogs = userId === 'emma' ? emmaLogs : simonLogs;

  const elapsed = getElapsedDays(CHALLENGE_START_DATE);
  const todayStr = today();
  const myCompletedDays = myLogs.filter(l => l.completed).length;
  const successRate = elapsed > 0 ? Math.round((myCompletedDays / elapsed) * 100) : 0;
  const myStreaks = computeStreaks(myLogs, CHALLENGE_START_DATE);

  const myAgg = computeAggregates(myLogs);

  const simonCompleted = simonLogs.filter(l => l.completed).length;
  const emmaCompleted = emmaLogs.filter(l => l.completed).length;
  const simonStreaks = computeStreaks(simonLogs, CHALLENGE_START_DATE);
  const emmaStreaks = computeStreaks(emmaLogs, CHALLENGE_START_DATE);
  const simonAgg = computeAggregates(simonLogs);
  const emmaAgg = computeAggregates(emmaLogs);
  const simonRate = elapsed > 0 ? Math.round((simonCompleted / elapsed) * 100) : 0;
  const emmaRate = elapsed > 0 ? Math.round((emmaCompleted / elapsed) * 100) : 0;

  function getTodayStatus(logs: { date: string; completed: boolean }[]): 'done' | 'missed' | 'ongoing' {
    const logToday = logs.find(l => l.date === todayStr);
    if (!logToday) return 'ongoing';
    return logToday.completed ? 'done' : 'ongoing';
  }

  const simonLeading = simonStreaks.current >= emmaStreaks.current;
  const emmaLeading = emmaStreaks.current >= simonStreaks.current;

  return (
    <div className="space-y-0 pb-2">

      {/* Page title */}
      <div className="pt-8 pb-4 animate-fade-up">
        <h1 className="font-[family-name:var(--font-playfair)] text-[32px] font-semibold leading-[1.05] tracking-tight">
          Statistiques
        </h1>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-foreground/[0.05] rounded-2xl p-1 gap-1 animate-fade-up delay-1">
        {(['stats', 'rival'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 h-9 rounded-xl text-[13px] font-semibold transition-all ${
              tab === t
                ? 'bg-card shadow-[inset_0_0_0_0.5px_var(--border)] text-foreground'
                : 'text-muted/50 hover:text-foreground/70'
            }`}>
            {t === 'stats' ? '📊 Mes stats' : '⚔️ Rival'}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <div className="space-y-0 animate-fade-up">

          {/* Challenge won banner */}
          {myStreaks.best >= CHALLENGE_DAYS && (
            <div className="mt-4 flex items-center gap-3 px-5 py-4 rounded-3xl bg-green/[0.10] shadow-[inset_0_0_0_0.5px_rgba(48,209,88,0.25)]">
              <span className="text-[26px]">🏆</span>
              <div>
                <div className="text-[14px] font-bold text-green">Défi réussi — {CHALLENGE_DAYS} jours d&apos;affilée</div>
                <div className="text-[12px] text-muted/60 mt-0.5">L&apos;habitude est ancrée. Continue sur ta lancée 💪</div>
              </div>
            </div>
          )}

          {/* Key stats 2x2 */}
          <SectionLabel>Performance</SectionLabel>
          <div className="bg-card rounded-3xl shadow-[inset_0_0_0_0.5px_var(--border)] overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-[var(--separator)]">
              <StatBlock label="Streak actuel" value={myStreaks.current} sub="jours" color="gradient-text" />
              <StatBlock label="Taux de réussite" value={`${successRate}%`} sub={`${myCompletedDays}/${elapsed} j`} color="text-green" />
            </div>
            <div className="h-px bg-[var(--separator)]" />
            <div className="grid grid-cols-2 divide-x divide-[var(--separator)]">
              <StatBlock label="Meilleur streak" value={myStreaks.best} sub="jours" color="gradient-text" />
              <StatBlock label="Jours complétés" value={myCompletedDays} sub={`sur ${elapsed} écoulés`} color="text-blue" />
            </div>
          </div>

          {/* Cumulative totals */}
          <SectionLabel>Cumul depuis le début</SectionLabel>
          <div className="bg-card rounded-3xl shadow-[inset_0_0_0_0.5px_var(--border)] overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-[var(--separator)]">
              <StatBlock label="Sports" value={myAgg.sports} sub="séances" color="text-accent" />
              <StatBlock label="Eau bue" value={`${myAgg.waterL}L`} sub="total" color="text-blue" />
            </div>
            <div className="h-px bg-[var(--separator)]" />
            <div className="grid grid-cols-2 divide-x divide-[var(--separator)]">
              <StatBlock label="Pas" value={myAgg.steps.toLocaleString('fr-FR')} sub="cumulés" color="text-green" />
              <StatBlock label="Pages lues" value={myAgg.pages} sub="pages" color="text-yellow" />
            </div>
          </div>

          {/* Weight chart */}
          <SectionLabel>Poids</SectionLabel>
          <WeightChart userId={userId} />

          {/* Calendar */}
          <SectionLabel>Calendrier du challenge</SectionLabel>
          <div className="bg-card rounded-3xl shadow-[inset_0_0_0_0.5px_var(--border)] p-5">
            <CalendarGrid logs={myLogs} startDate={CHALLENGE_START_DATE} />
          </div>
        </div>
      )}

      {tab === 'rival' && (
        <div className="space-y-0 animate-fade-up">

          {/* Rival cards */}
          <SectionLabel>Face à face</SectionLabel>
          <div className="flex gap-3">
            <RivalCard
              name="Simon" emoji="🦁"
              streak={simonStreaks.current} completed={simonCompleted} rate={simonRate}
              todayStatus={getTodayStatus(simonLogs)} isLeading={simonLeading && simonStreaks.current > emmaStreaks.current}
            />
            <RivalCard
              name="Emma" emoji="🦊"
              streak={emmaStreaks.current} completed={emmaCompleted} rate={emmaRate}
              todayStatus={getTodayStatus(emmaLogs)} isLeading={emmaLeading && emmaStreaks.current > simonStreaks.current}
            />
          </div>

          {/* Comparison table */}
          <SectionLabel>Comparaison</SectionLabel>
          <div className="bg-card rounded-3xl shadow-[inset_0_0_0_0.5px_var(--border)] overflow-hidden">
            <div className="flex items-center px-5 py-3 border-b border-[var(--separator)]">
              <div className="flex-1 text-[12px] text-muted/50">Statistique</div>
              <div className="w-16 text-center text-[14px]">🦁</div>
              <div className="w-16 text-center text-[14px]">🦊</div>
            </div>
            {[
              { label: 'Streak actuel', s: simonStreaks.current, e: emmaStreaks.current },
              { label: 'Meilleur streak', s: simonStreaks.best, e: emmaStreaks.best },
              { label: 'Jours complétés', s: simonCompleted, e: emmaCompleted },
              { label: 'Taux de réussite', s: `${simonRate}%`, e: `${emmaRate}%` },
              { label: 'Sports', s: simonAgg.sports, e: emmaAgg.sports },
              { label: 'Eau bue', s: `${simonAgg.waterL}L`, e: `${emmaAgg.waterL}L` },
              { label: 'Pas cumulés', s: simonAgg.steps, e: emmaAgg.steps },
              { label: 'Pages lues', s: simonAgg.pages, e: emmaAgg.pages },
            ].map(row => {
              const sNum = typeof row.s === 'number' ? row.s : parseFloat(row.s);
              const eNum = typeof row.e === 'number' ? row.e : parseFloat(row.e);
              return (
                <div key={row.label} className="flex items-center px-5 py-3.5 border-b border-[var(--separator)] last:border-0">
                  <div className="flex-1 text-[13px] text-muted/70">{row.label}</div>
                  <div className={`w-16 text-center font-[family-name:var(--font-jetbrains-mono)] text-[14px] font-bold ${sNum > eNum ? 'text-accent' : 'text-foreground/50'}`}>{row.s}</div>
                  <div className={`w-16 text-center font-[family-name:var(--font-jetbrains-mono)] text-[14px] font-bold ${eNum > sNum ? 'text-accent' : 'text-foreground/50'}`}>{row.e}</div>
                </div>
              );
            })}
          </div>

          {/* Dual calendar */}
          <SectionLabel>Calendrier commun</SectionLabel>
          <div className="bg-card rounded-3xl shadow-[inset_0_0_0_0.5px_var(--border)] p-5">
            <DualCalendar simonLogs={simonLogs} emmaLogs={emmaLogs} startDate={CHALLENGE_START_DATE} />
          </div>
        </div>
      )}
    </div>
  );
}
