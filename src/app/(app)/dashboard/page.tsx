'use client';

import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useProfile } from '@/hooks/useProfile';
import { useMeals } from '@/hooks/useMeals';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Button } from '@/components/ui/Button';
import { Icon, Monogram, type IconName } from '@/components/ui/Icon';
import { Counter } from '@/components/ui/Counter';
import { GOALS, CHALLENGE_DAYS, CHALLENGE_START_DATE, WATER_INCREMENTS } from '@/lib/constants';
import { getDayNumber, getCompletionPercentage, getObjectiveCount, isWorkoutDone, computeStreaks } from '@/lib/streak-engine';
import { toLocalDateStr, today } from '@/lib/dates';

import { useState, useEffect, useRef } from 'react';
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
    <button onClick={toggle} aria-label="Changer de thème"
      className="w-9 h-9 flex items-center justify-center rounded-2xl bg-card text-muted shadow-[inset_0_0_0_0.5px_var(--border)] transition-all active:scale-95">
      <Icon name={light ? 'moon' : 'sun'} size={17} />
    </button>
  );
}

// ─── Streak computation ────────────────────────────────────────────────────────

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
  icon: IconName; label: string; done?: boolean;
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
          done ? 'bg-green/[0.15] text-green' : 'bg-foreground/[0.06] text-muted'
        }`}>
          {done
            ? <span className="animate-check-pop"><Icon name="check" size={17} stroke={2.4} /></span>
            : <Icon name={icon} size={18} />
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
      if (s) setSimonStreak(computeStreaks(s as { date: string; completed: boolean }[], CHALLENGE_START_DATE).current);
      if (e) setEmmaStreak(computeStreaks(e as { date: string; completed: boolean }[], CHALLENGE_START_DATE).current);
    }
    fetchStreaks();
  }, [supabase]);

  const leading = simonStreak > emmaStreak ? 'simon' : emmaStreak > simonStreak ? 'emma' : null;

  const Side = ({ id, name, streak, align }: { id: string; name: string; streak: number; align: 'left' | 'right' }) => {
    const isLeading = leading === id;
    return (
      <div className={`flex items-center gap-3 flex-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <div className="relative shrink-0">
          <Monogram name={name} size={38} />
          {isLeading && (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-accent"><Icon name="crown" size={13} fill /></span>
          )}
        </div>
        <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
          <span className="text-[12px] text-foreground/70 font-medium leading-none mb-1.5">{name}</span>
          <span className="flex items-baseline gap-1">
            <span className={`font-[family-name:var(--font-jetbrains-mono)] text-[24px] font-bold tabular-nums leading-none ${isLeading ? 'text-accent' : 'text-foreground/45'}`}>{streak}</span>
            <span className="text-[10px] text-muted/40">j</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-3xl shadow-[inset_0_0_0_0.5px_var(--border)] px-4 pt-3 pb-3.5 animate-fade-up delay-3">
      <div className="text-center text-[9px] font-semibold text-muted/40 tracking-[0.18em] uppercase mb-3">Streak · jours d&apos;affilée</div>
      <div className="flex items-center gap-3">
        <Side id="simon" name="Simon" streak={simonStreak} align="left" />
        <span className="text-[9px] font-bold text-muted/35 tracking-[0.16em] shrink-0">VS</span>
        <Side id="emma" name="Emma" streak={emmaStreak} align="right" />
      </div>
    </div>
  );
}

// ─── Workout types ─────────────────────────────────────────────────────────────

const WORKOUT_TYPES = [
  { id: 'natation', label: 'Natation' },
  { id: 'course',   label: 'Course' },
  { id: 'salle',    label: 'Salle' },
  { id: 'velo',     label: 'Vélo' },
  { id: 'combat',   label: 'Combat' },
  { id: 'autre',    label: 'Autre' },
];

// ─── Completion overlay ────────────────────────────────────────────────────────

function CompletionOverlay({ show, onClose, streak }: { show: boolean; onClose: () => void; streak: number }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.90)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      onClick={onClose}>
      <div className="mb-5 animate-bounce-in text-accent"><Icon name="flame" size={84} fill stroke={1} /></div>
      <h2 className="font-[family-name:var(--font-playfair)] text-[30px] gradient-text mb-2 text-center">Journée parfaite</h2>
      <p className="text-muted text-[14px] text-center mb-7">Tous les objectifs sont complétés.</p>
      {streak > 0 && (
        <div className="flex items-center gap-4 px-8 py-5 rounded-3xl bg-accent/[0.08] shadow-[inset_0_0_0_0.5px_color-mix(in srgb,var(--accent) 20%,transparent)] mb-6">
          <span className="text-accent"><Icon name="flame" size={30} fill stroke={1} /></span>
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

// ─── Challenge-won overlay (75-day streak reached) ───────────────────────────────

function SuccessOverlay({ show, onClose, streak }: { show: boolean; onClose: () => void; streak: number }) {
  if (!show) return null;
  const confetti = Array.from({ length: 40 });
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 animate-fade-in overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)' }}
      onClick={onClose}>
      {/* Confetti */}
      {confetti.map((_, i) => {
        const colors = ['var(--accent)', 'var(--green)', 'var(--blue)', 'var(--yellow)', 'var(--red)'];
        return (
          <span key={i}
            className="absolute top-[-10%] rounded-[2px]"
            style={{
              left: `${(i * 97) % 100}%`,
              width: 8, height: 14,
              background: colors[i % colors.length],
              animation: `confetti-fall ${2.4 + (i % 5) * 0.35}s linear ${(i % 8) * 0.18}s infinite`,
              opacity: 0.9,
            }} />
        );
      })}
      <div className="relative flex flex-col items-center">
        <div className="mb-4 animate-bounce-in text-accent"><Icon name="trophy" size={92} stroke={1.2} /></div>
        <div className="text-[11px] font-bold text-accent/70 uppercase tracking-[0.28em] mb-2">Défi réussi</div>
        <h2 className="font-[family-name:var(--font-playfair)] text-[32px] gradient-text mb-3 text-center leading-tight">75 jours d&apos;affilée&nbsp;!</h2>
        <p className="text-muted text-[14px] text-center mb-7 max-w-[300px]">
          Tu as construit l&apos;habitude. Continue sur ta lancée — le défi ne s&apos;arrête pas ici. 💪
        </p>
        <div className="flex items-center gap-4 px-8 py-5 rounded-3xl bg-accent/[0.10] shadow-[inset_0_0_0_0.5px_color-mix(in srgb,var(--accent) 25%,transparent),0_0_50px_-10px_var(--glow-strong)] mb-6">
          <span className="text-accent"><Icon name="flame" size={30} fill stroke={1} /></span>
          <div>
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-[48px] font-bold gradient-text leading-none">{streak}</div>
            <div className="text-[11px] text-muted/70 mt-1">jours de streak</div>
          </div>
        </div>
        <p className="text-[11px] text-muted/35">Appuie n&apos;importe où pour continuer</p>
      </div>
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
  const { userId, userName } = useUser();
  const { log, loading, updateField, incrementWater } = useDailyLog(userId);
  const { profile, targets } = useProfile(userId);
  const { totals } = useMeals(userId);
  const [myStreak, setMyStreak] = useState(0);
  const [myBest, setMyBest] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const prevCompletedRef = useRef<boolean | null>(null);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [ringPop, setRingPop] = useState(false);
  const supabase = createClient();

  const challengeWon = myBest >= CHALLENGE_DAYS;

  useEffect(() => {
    async function fetchMyStreak() {
      const { data } = await supabase.from('daily_logs').select('date, completed')
        .eq('user_id', userId).order('date', { ascending: true });
      if (data) {
        const { current, best } = computeStreaks(data as { date: string; completed: boolean }[], CHALLENGE_START_DATE);
        setMyStreak(current);
        setMyBest(best);
        // Celebrate the first time the 75-day streak is reached (once per device).
        const wonKey = `75j-won-${userId}`;
        if (best >= CHALLENGE_DAYS && typeof window !== 'undefined' && !localStorage.getItem(wonKey)) {
          localStorage.setItem(wonKey, '1');
          setShowSuccess(true);
        }
      }
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

  // Pop premium de l'anneau quand un objectif de plus est complété.
  const prevCompletedCount = useRef(completedCount);
  useEffect(() => {
    if (completedCount > prevCompletedCount.current) {
      setRingPop(true);
      const t = setTimeout(() => setRingPop(false), 560);
      prevCompletedCount.current = completedCount;
      return () => clearTimeout(t);
    }
    prevCompletedCount.current = completedCount;
  }, [completedCount]);

  if (loading || !log) {
    return (
      <div className="space-y-3 pt-6">
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="h-2.5 w-12 rounded-full bg-card animate-pulse" />
          <div className="h-[72px] w-20 rounded-2xl bg-card animate-pulse" />
          <div className="h-2.5 w-20 rounded-full bg-card animate-pulse" />
        </div>
        <div className="bg-card rounded-3xl h-[150px] animate-pulse" />
        <div className="bg-card rounded-3xl h-[78px] animate-pulse" />
        <div className="bg-card rounded-3xl h-[300px] animate-pulse" />
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
      <CompletionOverlay show={showCompletion && !showSuccess} onClose={() => setShowCompletion(false)} streak={myStreak} />
      <SuccessOverlay show={showSuccess} onClose={() => setShowSuccess(false)} streak={myStreak} />

      {/* ── Hero header ── */}
      <div className="relative pt-6 pb-1 animate-fade-up">
        <Link href="/login" aria-label="Changer de profil"
          className="absolute top-2 left-0 w-9 h-9 flex items-center justify-center rounded-2xl bg-card text-muted/70 shadow-[inset_0_0_0_0.5px_var(--border)] transition-all active:scale-95 hover:text-foreground">
          <Icon name="users" size={16} />
        </Link>
        <div className="absolute top-2 right-0">
          <ThemeToggle />
        </div>
        <div className="text-center">
          <p className="text-[12px] font-bold text-muted/20 tracking-[0.12em] mb-1.5">
            Bonjour {userName}
          </p>
          <div className="inline-flex flex-col items-center">
            <span className="text-[10px] font-bold text-muted/45 tracking-[0.24em] uppercase mb-0.5">JOUR</span>
            <Counter value={dayNumber} className="font-[family-name:var(--font-playfair)] text-[84px] gradient-text leading-[0.9] tracking-tight" />
          </div>
          <p className="text-[13px] text-muted/20 font-bold mt-1.5">
            {dayNumber <= CHALLENGE_DAYS ? `sur ${CHALLENGE_DAYS} jours` : 'habitude en cours'}
          </p>
          {challengeWon && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-green/[0.12] shadow-[inset_0_0_0_0.5px_rgba(48,209,88,0.30)] animate-bounce-in text-green">
              <Icon name="trophy" size={13} stroke={2.2} />
              <span className="text-[12px] font-bold">Défi réussi</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Progress card (ring + streak + weekly dots) ── */}
      <div className="bg-card rounded-3xl shadow-[inset_0_0_0_0.5px_var(--border)] p-4 animate-fade-up delay-1">
        <div className="flex items-center gap-5">
          <div className={ringPop ? 'animate-ring-pop' : ''}>
          <ProgressRing value={completionPct} max={100} size={104} strokeWidth={8}>
            <div className="text-center">
              <div className={`font-[family-name:var(--font-jetbrains-mono)] text-[26px] font-bold leading-none ${completionPct === 100 ? 'gradient-text' : ''}`}>
                <Counter value={completionPct} /><span className="text-[11px] text-muted/30">%</span>
              </div>
              <div className="text-[10px] text-muted/50 mt-1">{completedCount}/{objectiveCount}</div>
            </div>
          </ProgressRing>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-muted/50 tracking-[0.16em] uppercase mb-1">Aujourd&apos;hui</div>
            <div className="text-[15px] font-semibold leading-tight mb-2.5">
              {completionPct === 100 ? 'Journée parfaite' : `${completedCount} objectif${completedCount > 1 ? 's' : ''} sur ${objectiveCount}`}
            </div>
            {myStreak > 0 ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent/[0.08] shadow-[inset_0_0_0_0.5px_var(--accent-ring)] text-accent">
                <Icon name="flame" size={15} fill />
                <Counter value={myStreak} className="font-[family-name:var(--font-jetbrains-mono)] text-[16px] font-bold leading-none" />
                <span className="text-[11px] text-accent/70">{challengeWon ? 'jours' : `/ ${CHALLENGE_DAYS}`}</span>
              </div>
            ) : (
              <div className="text-[12px] text-muted/50">Complète ta journée pour lancer un streak</div>
            )}
          </div>
        </div>
        <div className="mt-4 pt-3.5 border-t border-[var(--separator)]">
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
            icon="droplet" label="Eau" done={waterDone}
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
            icon="footprints" label="Pas" done={stepsDone}
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
            icon={isRestDay ? 'moon' : 'dumbbell'} label={GOALS.workout.label} done={workoutDone}
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
                  className={`flex-1 h-10 rounded-xl text-[13px] font-semibold transition-all inline-flex items-center justify-center gap-1.5 ${
                    isRestDay ? 'bg-blue/10 text-blue shadow-[inset_0_0_0_0.5px_rgba(10,132,255,0.25)]' : 'bg-foreground/[0.04] text-muted shadow-[inset_0_0_0_0.5px_var(--separator)]'
                  }`}>
                  {isRestDay && <Icon name="check" size={14} stroke={2.4} />}Repos
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
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                          (log.workout_types ?? []).includes(wt.id)
                            ? 'bg-accent/12 text-accent shadow-[inset_0_0_0_0.5px_var(--accent-ring)]'
                            : 'bg-foreground/[0.04] text-muted shadow-[inset_0_0_0_0.5px_var(--separator)]'
                        }`}>
                        {wt.label}
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
            icon="sparkle" label="Objectif perso" done={log.stretching || log.reinforcement}
            valueNode={
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums text-muted/40">
                {log.stretching || log.reinforcement
                  ? <span className="text-green">{[log.stretching && 'Flex', log.reinforcement && 'Musique'].filter(Boolean).join(' · ')}</span>
                  : '—'}
              </span>
            }
          >
            <div className="flex gap-2">
              {(['stretching', 'reinforcement'] as const).map((field, i) => (
                <button key={field} onClick={() => updateField(field, !log[field])}
                  className={`flex-1 h-10 rounded-xl text-[13px] font-semibold transition-all inline-flex items-center justify-center gap-1.5 ${
                    log[field]
                      ? 'bg-green/10 text-green shadow-[inset_0_0_0_0.5px_rgba(48,209,88,0.25)]'
                      : 'bg-foreground/[0.04] text-muted shadow-[inset_0_0_0_0.5px_var(--separator)]'
                  }`}>
                  <Icon name={log[field] ? 'check' : i === 0 ? 'activity' : 'music'} size={15} stroke={2} />
                  {i === 0 ? 'Flex' : 'Musique'}
                </button>
              ))}
            </div>
          </HabitRow>

          {/* Calories */}
          <HabitRow
            icon="flame" label="Calories" done={caloriesDone}
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
            icon="book" label={GOALS.pages.label} done={pagesDone}
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

    </div>
  );
}
