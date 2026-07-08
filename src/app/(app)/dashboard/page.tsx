'use client';

import { useUser } from '@/hooks/useUser';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useProfile } from '@/hooks/useProfile';
import { useMeals } from '@/hooks/useMeals';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Button } from '@/components/ui/Button';
import { GOALS, CHALLENGE_DAYS, CHALLENGE_START_DATE, WATER_INCREMENTS } from '@/lib/constants';
import { getDayNumber, getCompletionPercentage, getObjectiveCount, isWorkoutDone } from '@/lib/streak-engine';
import { toLocalDateStr, today } from '@/lib/dates';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// ─── Theme toggle ──────────────────────────────────────────────────────────────

function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => { setLight(document.documentElement.classList.contains('light')); }, []);
  function toggle() {
    const isLight = !light;
    setLight(isLight);
    document.documentElement.classList.toggle('light', isLight);
    localStorage.setItem('75j-theme', isLight ? 'light' : 'dark');
  }
  return (
    <button onClick={toggle}
      className="w-9 h-9 flex items-center justify-center rounded-2xl bg-card shadow-[inset_0_0_0_0.5px_var(--border)] transition-all text-sm active:scale-95">
      {light ? '🌙' : '☀️'}
    </button>
  );
}

// ─── Streak computation ────────────────────────────────────────────────────────

function computeCurrentStreak(logs: { date: string; completed: boolean }[]): number {
  const todayStr = today();
  const completedSet = new Set(logs.filter((l) => l.completed).map((l) => l.date));
  let running = 0;
  const d = new Date(CHALLENGE_START_DATE + 'T00:00:00');
  const end = new Date(todayStr + 'T00:00:00');
  while (d <= end) {
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    completedSet.has(ds) ? running++ : (running = 0);
    d.setDate(d.getDate() + 1);
  }
  return running;
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-1 mb-2 ${className}`}>
      <span className="text-[11px] font-semibold text-muted/50 tracking-[0.16em] uppercase">{children}</span>
    </div>
  );
}

// ─── Habit group wrapper ────────────────────────────────────────────────────────

function HabitGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-3xl overflow-hidden shadow-[inset_0_0_0_0.5px_var(--border)] divide-y divide-[var(--separator)]">
      {children}
    </div>
  );
}

// ─── Habit row ─────────────────────────────────────────────────────────────────

function HabitRow({
  icon, label, done, valueNode, children, noExpand, initialOpen,
}: {
  icon: string; label: string; done?: boolean;
  valueNode?: React.ReactNode;
  children?: React.ReactNode;
  noExpand?: boolean;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen ?? false);
  const expandable = !!children && !noExpand;

  return (
    <div>
      <div
        onClick={() => expandable && setOpen(!open)}
        className={`flex items-center gap-3.5 px-5 py-[15px] transition-colors ${expandable ? 'cursor-pointer active:bg-foreground/[0.03]' : ''}`}
      >
        <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 transition-all duration-300 ${
          done ? 'bg-green/[0.15] text-green' : 'bg-foreground/[0.07]'
        }`}>
          {done
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            : <span className="text-[17px]">{icon}</span>
          }
        </div>
        <span className="flex-1 text-[15px] font-medium leading-tight">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          {valueNode}
          {expandable && (
            <svg
              className={`w-[15px] h-[15px] text-muted/25 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
      {noExpand && children && <div className="px-5 pb-4">{children}</div>}
      {expandable && open && <div className="px-5 pb-5 animate-slide-down">{children}</div>}
    </div>
  );
}

// ─── Weekly dots (inline, no card wrapper) ────────────────────────────────────

function WeeklyDots({ userId }: { userId: string }) {
  const [days, setDays] = useState<{ date: string; completed: boolean }[]>([]);
  const supabase = createClient();
  const todayStr = today();

  useEffect(() => {
    async function fetch() {
      const now = new Date(todayStr + 'T00:00:00');
      const dow = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
      const { data } = await supabase.from('daily_logs')
        .select('date, completed')
        .eq('user_id', userId)
        .gte('date', toLocalDateStr(monday))
        .lte('date', todayStr);
      setDays((data ?? []) as { date: string; completed: boolean }[]);
    }
    fetch();
  }, [userId, supabase, todayStr]);

  const now = new Date(todayStr + 'T00:00:00');
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  const weekDays = ['L','M','M','J','V','S','D'];
  const daySlots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const ds = toLocalDateStr(d);
    const isFuture = ds > todayStr;
    const isToday = ds === todayStr;
    const log = days.find(l => l.date === ds);
    return { ds, isFuture, isToday, completed: log?.completed ?? false };
  });
  const weekPct = Math.round(daySlots.filter(d => d.completed).length / 7 * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-semibold text-muted/50 tracking-[0.12em] uppercase">Cette semaine</span>
        <span className="text-[13px] font-bold text-accent">{weekPct}%</span>
      </div>
      <div className="flex gap-1.5 justify-between">
        {daySlots.map((slot, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="text-[10px] text-muted/40 font-medium">{weekDays[i]}</div>
            <div className={`w-full aspect-square rounded-lg transition-all ${
              slot.isFuture ? 'bg-foreground/[0.05]'
              : slot.isToday && !slot.completed ? 'bg-accent/25 ring-1 ring-accent/30'
              : slot.completed ? 'bg-green'
              : 'bg-red/40'
            }`} style={{ maxWidth: 28, maxHeight: 28 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Streak Battle ─────────────────────────────────────────────────────────────

function StreakBattle() {
  const [simonStreak, setSimonStreak] = useState(0);
  const [emmaStreak, setEmmaStreak] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStreaks() {
      const [{ data: s }, { data: e }] = await Promise.all([
        supabase.from('daily_logs').select('date, completed').eq('user_id', 'simon').order('date', { ascending: true }),
        supabase.from('daily_logs').select('date, completed').eq('user_id', 'emma').order('date', { ascending: true }),
      ]);
      if (s) setSimonStreak(computeCurrentStreak(s as { date: string; completed: boolean }[]));
      if (e) setEmmaStreak(computeCurrentStreak(e as { date: string; completed: boolean }[]));
    }
    fetchStreaks();
  }, [supabase]);

  const leading = simonStreak > emmaStreak ? 'simon' : emmaStreak > simonStreak ? 'emma' : null;

  return (
    <div className="bg-card rounded-3xl shadow-[inset_0_0_0_0.5px_rgba(255,107,44,0.18),0_0_40px_-8px_var(--glow-strong)] overflow-hidden animate-fade-up delay-3">
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-accent/35 to-transparent" />
      <div className="p-5">
        <div className="text-[10px] font-bold text-accent/70 uppercase tracking-[0.22em] text-center mb-4">Streak Battle</div>
        <div className="flex items-center justify-center gap-6">
          {[
            { id: 'simon', emoji: '🦁', streak: simonStreak },
            { id: 'emma',  emoji: '🦊', streak: emmaStreak },
          ].reduce<React.ReactNode[]>((acc, u, i) => {
            const isLeading = leading === u.id;
            const el = (
              <div key={u.id} className="flex flex-col items-center gap-2">
                <span className="text-[36px]">{isLeading ? '👑' : u.emoji}</span>
                <span className={`font-[family-name:var(--font-jetbrains-mono)] text-[46px] font-bold tabular-nums leading-none ${isLeading ? 'gradient-text' : 'text-foreground/50'}`}>
                  {u.streak}
                </span>
                <span className="text-[10px] text-muted/50 font-semibold tracking-wider uppercase">{u.id}</span>
              </div>
            );
            if (i === 0) return [el];
            return [...acc, (
              <div key="vs" className="flex flex-col items-center gap-1.5 px-2">
                <div className="w-px h-6 bg-gradient-to-b from-transparent via-accent/20 to-transparent" />
                <div className="w-8 h-8 rounded-full border border-accent/20 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-accent/60 tracking-widest">VS</span>
                </div>
                <div className="w-px h-6 bg-gradient-to-b from-transparent via-accent/20 to-transparent" />
              </div>
            ), el];
          }, [])}
        </div>
      </div>
    </div>
  );
}

// ─── Workout types ─────────────────────────────────────────────────────────────

const WORKOUT_TYPES = [
  { id: 'natation', icon: '🏊', label: 'Natation' },
  { id: 'course',   icon: '🏃', label: 'Course' },
  { id: 'salle',    icon: '🏋️', label: 'Salle' },
  { id: 'velo',     icon: '🚴', label: 'Vélo' },
  { id: 'combat',   icon: '🥊', label: 'Combat' },
  { id: 'autre',    icon: '🧗', label: 'Autre' },
];

// ─── Weight tracker row ────────────────────────────────────────────────────────

function WeightRow({ userId }: { userId: string }) {
  const [todayWeight, setTodayWeight] = useState<number | null>(null);
  const [yesterdayWeight, setYesterdayWeight] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const todayStr = today();

  useEffect(() => {
    async function fetchWeights() {
      const res = await fetch(`/api/weight?userId=${userId}&all=true`);
      if (!res.ok) return;
      const data: { date: string; weight_kg: number }[] = await res.json();
      const yest = new Date(todayStr + 'T00:00:00');
      yest.setDate(yest.getDate() - 1);
      const yestStr = toLocalDateStr(yest);
      setTodayWeight(data.find(d => d.date === todayStr)?.weight_kg ?? null);
      setYesterdayWeight(data.find(d => d.date === yestStr)?.weight_kg ?? null);
    }
    fetchWeights();
  }, [userId, todayStr]);

  async function save() {
    const kg = parseFloat(input);
    if (isNaN(kg) || kg < 20 || kg > 300) return;
    setSaving(true);
    const res = await fetch('/api/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, date: todayStr, weight_kg: kg }),
    });
    if (res.ok) { setTodayWeight(kg); setInput(''); }
    setSaving(false);
  }

  const diff = todayWeight !== null && yesterdayWeight !== null ? todayWeight - yesterdayWeight : null;
  const diffColor = diff === null ? '' : diff > 0 ? 'text-red' : diff < 0 ? 'text-green' : 'text-muted/40';
  const arrow = diff === null ? '' : diff > 0 ? '↑' : diff < 0 ? '↓' : '=';

  return (
    <HabitRow
      icon="⚖️"
      label="Poids"
      done={todayWeight !== null}
      valueNode={
        todayWeight !== null ? (
          <div className="flex items-center gap-1.5">
            <span className="font-[family-name:var(--font-jetbrains-mono)] text-[14px] font-bold">{todayWeight} kg</span>
            {diff !== null && (
              <span className={`text-[12px] font-semibold ${diffColor}`}>{arrow} {Math.abs(diff).toFixed(1)}</span>
            )}
          </div>
        ) : undefined
      }
      initialOpen={todayWeight === null}
    >
      <div className="flex gap-2 pt-1">
        <input
          type="number" step="0.1"
          placeholder={todayWeight !== null ? `${todayWeight} kg` : 'Ex: 75.5'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          className="flex-1 h-10 px-3 rounded-xl bg-foreground/[0.05] shadow-[inset_0_0_0_0.5px_var(--border)] text-[14px] outline-none focus:shadow-[inset_0_0_0_1px_rgba(255,107,44,0.30)] transition-all placeholder:text-muted/30"
        />
        <Button size="sm" onClick={save} disabled={saving || !input}>
          {saving ? '...' : 'Sauver'}
        </Button>
      </div>
    </HabitRow>
  );
}

// ─── Daily Note row ────────────────────────────────────────────────────────────

function NoteRow({ note, onSave }: { note: string | null; onSave: (v: string) => void }) {
  const [value, setValue] = useState(note ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((v: string) => {
    setValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSave(v), 500);
  }, [onSave]);

  return (
    <HabitRow icon="✏️" label="Note du jour" done={!!value} noExpand>
      <textarea
        value={value}
        onChange={e => handleChange(e.target.value)}
        placeholder="Comment s'est passée ta journée ?"
        rows={3}
        className="w-full px-3 py-2.5 rounded-xl bg-foreground/[0.04] shadow-[inset_0_0_0_0.5px_var(--separator)] text-[14px] outline-none focus:shadow-[inset_0_0_0_1px_rgba(255,107,44,0.25)] transition-all resize-none placeholder:text-muted/25 leading-relaxed"
      />
    </HabitRow>
  );
}

// ─── Completion overlay ────────────────────────────────────────────────────────

function CompletionOverlay({ show, onClose, streak }: { show: boolean; onClose: () => void; streak: number }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.90)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      onClick={onClose}>
      <div className="text-[96px] mb-4 animate-bounce-in">🔥</div>
      <h2 className="font-[family-name:var(--font-dela-gothic)] text-[26px] gradient-text mb-2 text-center">Journée parfaite !</h2>
      <p className="text-muted text-[14px] text-center mb-7">Tous les objectifs sont complétés.</p>
      {streak > 0 && (
        <div className="flex items-center gap-4 px-8 py-5 rounded-3xl bg-accent/[0.08] shadow-[inset_0_0_0_0.5px_rgba(255,107,44,0.20)] mb-6">
          <span className="text-3xl">🔥</span>
          <div>
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-[44px] font-bold gradient-text leading-none">{streak}</div>
            <div className="text-[11px] text-muted/70 mt-1">jours de streak</div>
          </div>
        </div>
      )}
      <p className="text-[11px] text-muted/35">Appuie n&apos;importe où pour continuer</p>
    </div>
  );
}

// ─── Calories helper ───────────────────────────────────────────────────────────

function isCalorieGoalMet(calories: number, target: number, goal: string): boolean {
  if (goal === 'gain') return calories >= target;
  return calories <= target;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { userId, userName, userEmoji } = useUser();
  const { log, loading, updateField, incrementWater } = useDailyLog(userId);
  const { profile, targets } = useProfile(userId);
  const { totals } = useMeals(userId);
  const [myStreak, setMyStreak] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const prevCompletedRef = useRef<boolean | null>(null);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMyStreak() {
      const { data } = await supabase.from('daily_logs').select('date, completed')
        .eq('user_id', userId).order('date', { ascending: true });
      if (data) setMyStreak(computeCurrentStreak(data as { date: string; completed: boolean }[]));
    }
    fetchMyStreak();
  }, [userId, supabase, log?.completed]);

  useEffect(() => {
    if (log) {
      const wasCompleted = prevCompletedRef.current;
      if (wasCompleted === false && log.completed === true) setShowCompletion(true);
      prevCompletedRef.current = log.completed;
    }
  }, [log?.completed]);

  // Weekly workout total for workout row
  useEffect(() => {
    async function fetchWeek() {
      const now = new Date();
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const { data } = await supabase.from('daily_logs').select('workout_count')
        .eq('user_id', userId).gte('date', toLocalDateStr(monday)).lte('date', toLocalDateStr(sunday));
      if (data) setWeeklyTotal(data.reduce((s: number, d: { workout_count: number }) => s + Math.max(d.workout_count || 0, 0), 0));
    }
    if (log) fetchWeek();
  }, [userId, log?.workout_count, supabase]);

  const caloriesDone = isCalorieGoalMet(totals.calories, targets.calories, profile.goal);
  const dayNumber = getDayNumber(CHALLENGE_START_DATE);
  const completionPct = log ? getCompletionPercentage(log, caloriesDone) : 0;
  const objectiveCount = getObjectiveCount();
  const completedCount = log ? Math.round((completionPct / 100) * objectiveCount) : 0;

  if (loading || !log) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-3">
        <div className="w-7 h-7 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
        <span className="text-[13px] text-muted">Chargement...</span>
      </div>
    );
  }

  const isRestDay = log.workout_count === -1;
  const workoutDone = isWorkoutDone(log.workout_count);
  const waterDone = log.water_ml >= GOALS.water_ml.target;
  const stepsDone = log.steps >= GOALS.steps.target;
  const pagesDone = log.pages >= GOALS.pages.target;

  return (
    <div className="space-y-3">
      <CompletionOverlay show={showCompletion} onClose={() => setShowCompletion(false)} streak={myStreak} />

      {/* ── Hero header ── */}
      <div className="relative pt-10 pb-2 animate-fade-up">
        <div className="absolute top-3 right-0">
          <ThemeToggle />
        </div>
        <div className="text-center">
          <p className="text-[12px] font-medium text-muted/60 tracking-[0.12em] mb-3">
            Bonjour {userName} {userEmoji}
          </p>
          <div className="inline-flex flex-col items-center">
            <span className="text-[10px] font-bold text-muted/35 tracking-[0.22em] uppercase">JOUR</span>
            <span className="font-[family-name:var(--font-dela-gothic)] text-[96px] gradient-text leading-none tracking-tight">
              {dayNumber}
            </span>
          </div>
          <p className="text-[14px] text-muted/40 font-medium mt-1">sur {CHALLENGE_DAYS} jours</p>
        </div>
      </div>

      {/* ── Progress card (ring + streak + weekly dots) ── */}
      <div className="bg-card rounded-3xl shadow-[inset_0_0_0_0.5px_var(--border)] p-5 flex flex-col items-center animate-fade-up delay-1">
        <ProgressRing value={completionPct} max={100} size={168} strokeWidth={10}>
          <div className="text-center">
            <div className={`font-[family-name:var(--font-jetbrains-mono)] text-[42px] font-bold leading-none ${completionPct === 100 ? 'gradient-text' : ''}`}>
              {completionPct}<span className="text-[15px] text-muted/30">%</span>
            </div>
            <div className="text-[11px] text-muted/50 mt-1.5">
              {completionPct === 100 ? '🔥 Parfait' : `${completedCount}/${objectiveCount}`}
            </div>
          </div>
        </ProgressRing>

        {myStreak > 0 && (
          <div className="mt-5 flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-accent/[0.07] shadow-[inset_0_0_0_0.5px_rgba(255,107,44,0.15)]">
            <span className="text-[18px]">🔥</span>
            <span className="font-[family-name:var(--font-jetbrains-mono)] text-[22px] font-bold gradient-text">{myStreak}</span>
            <span className="text-[12px] text-accent/60">jours de streak</span>
          </div>
        )}

        <div className="w-full mt-5 pt-4 border-t border-[var(--separator)]">
          <WeeklyDots userId={userId} />
        </div>
      </div>

      {/* ── Streak Battle ── */}
      <StreakBattle />

      {/* ── Habits group ── */}
      <div className="animate-fade-up delay-4">
        <SectionLabel>Objectifs du jour</SectionLabel>
        <HabitGroup>

          {/* Water */}
          <HabitRow
            icon="💧" label="Eau" done={waterDone}
            valueNode={
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums">
                <span className={waterDone ? 'text-green' : ''}>{(log.water_ml/1000).toFixed(1)}L</span>
                <span className="text-muted/40"> /{GOALS.water_ml.target/1000}L</span>
              </span>
            }
          >
            <div className="space-y-3 pt-1">
              <ProgressBar value={log.water_ml} max={GOALS.water_ml.target} color={waterDone ? 'bg-green' : 'bg-blue'} />
              <div className="flex gap-1.5 flex-wrap">
                {WATER_INCREMENTS.map(amt => (
                  <Button key={amt} size="sm" variant="secondary" onClick={() => incrementWater(amt)}>
                    +{amt >= 1000 ? `${amt/1000}L` : `${amt}ml`}
                  </Button>
                ))}
                {log.water_ml > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => updateField('water_ml', 0)} className="ml-auto text-muted/60">Reset</Button>
                )}
              </div>
            </div>
          </HabitRow>

          {/* Steps */}
          <HabitRow
            icon="👟" label="Pas" done={stepsDone}
            valueNode={
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums">
                <span className={stepsDone ? 'text-green' : ''}>{log.steps.toLocaleString()}</span>
                <span className="text-muted/40"> /{GOALS.steps.target.toLocaleString()}</span>
              </span>
            }
          >
            <div className="space-y-3 pt-1">
              <ProgressBar value={log.steps} max={GOALS.steps.target} color={stepsDone ? 'bg-green' : 'bg-accent'} />
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {log.steps >= 1000 && <Button size="sm" variant="secondary" onClick={() => updateField('steps', log.steps - 1000)}>-1k</Button>}
                  <Button size="sm" variant="secondary" onClick={() => updateField('steps', log.steps + 1000)}>+1k</Button>
                  <Button size="sm" variant="secondary" onClick={() => updateField('steps', log.steps + 5000)}>+5k</Button>
                </div>
                {log.steps > 0 && <Button size="sm" variant="ghost" onClick={() => updateField('steps', 0)} className="text-muted/60">Reset</Button>}
              </div>
            </div>
          </HabitRow>

          {/* Workout */}
          <HabitRow
            icon={isRestDay ? '😴' : GOALS.workout.icon} label={GOALS.workout.label} done={workoutDone}
            valueNode={
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums">
                {isRestDay ? <span className="text-blue text-[12px]">Rest</span>
                  : log.workout_count > 0 ? <span className={workoutDone ? 'text-green' : ''}>{log.workout_count}</span>
                  : <span className="text-muted/30">—</span>}
              </span>
            }
          >
            <div className="space-y-3 pt-1">
              <div className="flex gap-2">
                <button
                  onClick={() => updateField('workout_count', isRestDay ? 0 : -1)}
                  className={`flex-1 h-10 rounded-xl text-[13px] font-semibold transition-all ${
                    isRestDay ? 'bg-blue/10 text-blue shadow-[inset_0_0_0_0.5px_rgba(10,132,255,0.25)]' : 'bg-foreground/[0.04] text-muted shadow-[inset_0_0_0_0.5px_var(--separator)]'
                  }`}>
                  {isRestDay ? '✓ ' : ''}Rest day
                </button>
                <div className="flex gap-1.5">
                  {log.workout_count > 0 && <Button size="sm" variant="secondary" onClick={() => updateField('workout_count', log.workout_count - 1)}>-</Button>}
                  <Button size="sm" variant="secondary" onClick={() => updateField('workout_count', Math.max(log.workout_count, 0) + 1)}>+1</Button>
                </div>
              </div>
              {log.workout_count > 0 && (
                <div>
                  <div className="text-[11px] text-muted/40 font-medium mb-2">Type de workout</div>
                  <div className="flex flex-wrap gap-1.5">
                    {WORKOUT_TYPES.map(wt => (
                      <button key={wt.id}
                        onClick={() => {
                          const types = log.workout_types ?? [];
                          const next = types.includes(wt.id) ? types.filter((t: string) => t !== wt.id) : [...types, wt.id];
                          updateField('workout_types', next);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all ${
                          (log.workout_types ?? []).includes(wt.id)
                            ? 'bg-accent/12 text-accent shadow-[inset_0_0_0_0.5px_rgba(255,107,44,0.25)]'
                            : 'bg-foreground/[0.04] text-muted shadow-[inset_0_0_0_0.5px_var(--separator)]'
                        }`}>
                        <span>{wt.icon}</span><span>{wt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-2 border-t border-[var(--separator)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-muted/50 font-medium">Semaine</span>
                  <span className="font-[family-name:var(--font-jetbrains-mono)] text-[12px] tabular-nums">
                    <span className={weeklyTotal >= 7 ? 'text-green' : ''}>{weeklyTotal}</span>
                    <span className="text-muted/40">/7</span>
                  </span>
                </div>
                <ProgressBar value={weeklyTotal} max={7} color={weeklyTotal >= 7 ? 'bg-green' : 'bg-accent'} />
              </div>
            </div>
          </HabitRow>

          {/* Objectif perso — Flex ou Musique */}
          <HabitRow
            icon="🧘" label="Objectif perso" done={log.stretching || log.reinforcement}
            noExpand
          >
            <div className="flex gap-2">
              {(['stretching', 'reinforcement'] as const).map((field, i) => (
                <button key={field} onClick={() => updateField(field, !log[field])}
                  className={`flex-1 h-10 rounded-xl text-[13px] font-semibold transition-all ${
                    log[field]
                      ? 'bg-green/10 text-green shadow-[inset_0_0_0_0.5px_rgba(48,209,88,0.25)]'
                      : 'bg-foreground/[0.04] text-muted shadow-[inset_0_0_0_0.5px_var(--separator)]'
                  }`}>
                  {log[field] ? '✓ ' : ''}{i === 0 ? '🧘 Flex' : '🎵 Musique'}
                </button>
              ))}
            </div>
          </HabitRow>

          {/* Calories */}
          <HabitRow
            icon="🍽" label="Calories" done={caloriesDone}
            valueNode={
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums">
                <span className={caloriesDone ? 'text-green' : totals.calories > targets.calories ? 'text-red' : ''}>
                  {Math.round(totals.calories)}
                </span>
                <span className="text-muted/40"> /{targets.calories}</span>
              </span>
            }
          >
            <div className="pt-1">
              <ProgressBar value={totals.calories} max={targets.calories}
                color={totals.calories > targets.calories ? 'bg-red' : caloriesDone ? 'bg-green' : 'bg-accent'} />
              <div className={`text-[11px] mt-2 ${totals.calories > targets.calories && profile.goal === 'lose' ? 'text-red/70 font-medium' : 'text-muted/40'}`}>
                {profile.goal === 'lose'
                  ? totals.calories > targets.calories ? `+${Math.round(totals.calories - targets.calories)} kcal de trop` : `${Math.round(targets.calories - totals.calories)} kcal restants`
                  : profile.goal === 'maintain' ? 'Reste autour de ta cible (±10%)' : 'Atteins ta cible calorique'}
              </div>
            </div>
          </HabitRow>

          {/* Pages */}
          <HabitRow
            icon={GOALS.pages.icon} label={GOALS.pages.label} done={pagesDone}
            valueNode={
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums">
                <span className={pagesDone ? 'text-green' : ''}>{log.pages}</span>
                <span className="text-muted/40"> /{GOALS.pages.target}</span>
              </span>
            }
          >
            <div className="space-y-3 pt-1">
              <ProgressBar value={log.pages} max={GOALS.pages.target} color={pagesDone ? 'bg-green' : 'bg-yellow'} />
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {log.pages > 0 && <Button size="sm" variant="secondary" onClick={() => updateField('pages', Math.max(0, log.pages - 1))}>-1</Button>}
                  <Button size="sm" variant="secondary" onClick={() => updateField('pages', log.pages + 1)}>+1</Button>
                  <Button size="sm" variant="secondary" onClick={() => updateField('pages', log.pages + 5)}>+5</Button>
                </div>
                {log.pages > 0 && <Button size="sm" variant="ghost" onClick={() => updateField('pages', 0)} className="text-muted/60">Reset</Button>}
              </div>
            </div>
          </HabitRow>

        </HabitGroup>
      </div>

      {/* ── Suivi group ── */}
      <div className="animate-fade-up delay-5">
        <SectionLabel>Suivi</SectionLabel>
        <HabitGroup>
          <WeightRow userId={userId} />
          <NoteRow note={log.note} onSave={v => updateField('note', v || null)} />
        </HabitGroup>
      </div>

    </div>
  );
}
