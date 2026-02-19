'use client';

import { useUser } from '@/hooks/useUser';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useProfile } from '@/hooks/useProfile';
import { useMeals } from '@/hooks/useMeals';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Button } from '@/components/ui/Button';
import { Timer } from '@/components/ui/Timer';
import { GOALS, CHALLENGE_DAYS, CHALLENGE_START_DATE, WATER_INCREMENTS } from '@/lib/constants';
import { getDayNumber, getCompletionPercentage, isWorkoutDone } from '@/lib/streak-engine';
import { toLocalDateStr, today } from '@/lib/dates';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains('light'));
  }, []);

  function toggle() {
    const isLight = !light;
    setLight(isLight);
    document.documentElement.classList.toggle('light', isLight);
    localStorage.setItem('75j-theme', isLight ? 'light' : 'dark');
  }

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border border-border hover:border-accent/20 transition-all text-sm active:scale-95"
    >
      {light ? '🌙' : '☀️'}
    </button>
  );
}

function computeCurrentStreak(logs: { date: string; completed: boolean }[]): number {
  const todayStr = today();
  const completedSet = new Set(logs.filter((l) => l.completed).map((l) => l.date));
  let streak = 0;
  const d = new Date(CHALLENGE_START_DATE + 'T00:00:00');
  const end = new Date(todayStr + 'T00:00:00');
  let running = 0;
  while (d <= end) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (completedSet.has(dateStr)) {
      running++;
    } else {
      running = 0;
    }
    d.setDate(d.getDate() + 1);
  }
  streak = running;
  return streak;
}

function StreakBattle() {
  const [simonStreak, setSimonStreak] = useState(0);
  const [emmaStreak, setEmmaStreak] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStreaks() {
      const { data: sLogs } = await supabase.from('daily_logs').select('date, completed').eq('user_id', 'simon').order('date', { ascending: true });
      const { data: eLogs } = await supabase.from('daily_logs').select('date, completed').eq('user_id', 'emma').order('date', { ascending: true });
      if (sLogs) setSimonStreak(computeCurrentStreak(sLogs as { date: string; completed: boolean }[]));
      if (eLogs) setEmmaStreak(computeCurrentStreak(eLogs as { date: string; completed: boolean }[]));
    }
    fetchStreaks();
  }, [supabase]);

  const leading = simonStreak > emmaStreak ? 'simon' : emmaStreak > simonStreak ? 'emma' : null;

  return (
    <Card accent>
      <div className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] text-center mb-5">Streak Battle</div>
      <div className="flex items-center">
        <div className="flex-1 flex flex-col items-center gap-3">
          <span className="text-4xl">{leading === 'simon' ? '👑' : '🦁'}</span>
          <span className={`font-[family-name:var(--font-jetbrains-mono)] text-5xl font-bold tabular-nums ${leading === 'simon' ? 'gradient-text' : 'text-foreground/60'}`}>{simonStreak}</span>
          <span className="text-[10px] text-muted font-semibold tracking-wider uppercase">Simon</span>
        </div>
        <div className="flex flex-col items-center px-5">
          <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-accent/20 to-transparent" />
          <div className="w-8 h-8 rounded-full border border-accent/20 flex items-center justify-center my-2">
            <span className="text-[9px] font-bold text-accent tracking-widest">VS</span>
          </div>
          <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-accent/20 to-transparent" />
        </div>
        <div className="flex-1 flex flex-col items-center gap-3">
          <span className="text-4xl">{leading === 'emma' ? '👑' : '🦊'}</span>
          <span className={`font-[family-name:var(--font-jetbrains-mono)] text-5xl font-bold tabular-nums ${leading === 'emma' ? 'gradient-text' : 'text-foreground/60'}`}>{emmaStreak}</span>
          <span className="text-[10px] text-muted font-semibold tracking-wider uppercase">Emma</span>
        </div>
      </div>
    </Card>
  );
}

function HabitCard({ icon, label, right, children, done }: { icon: string; label: string; right?: React.ReactNode; children?: React.ReactNode; done?: boolean }) {
  return (
    <Card className={`animate-scale-in ${done ? 'border-green/20' : ''}`}>
      {/* Green top line when done */}
      {done && <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-green to-transparent" />}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-300 ${done ? 'bg-green/15 shadow-[0_0_15px_-3px_var(--green)]' : 'bg-foreground/[0.06]'}`}>{icon}</div>
          <span className="text-[14px] font-semibold">{label}</span>
        </div>
        {right}
      </div>
      {children}
    </Card>
  );
}

function WaterTracker({ water, onIncrement, onSet }: { water: number; onIncrement: (n: number) => void; onSet: (n: number) => void }) {
  const done = water >= GOALS.water_ml.target;

  return (
    <HabitCard
      icon={GOALS.water_ml.icon}
      label={GOALS.water_ml.label}
      done={done}
      right={
        <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums">
          <span className={done ? 'text-green' : 'text-foreground'}>{(water / 1000).toFixed(1)}L</span>
          <span className="text-muted/60"> / {GOALS.water_ml.target / 1000}L</span>
        </span>
      }
    >
      <ProgressBar value={water} max={GOALS.water_ml.target} color={done ? 'bg-green' : 'bg-blue'} />
      <div className="flex gap-1.5 mt-3">
        {WATER_INCREMENTS.map((amt) => (
          <Button key={amt} size="sm" variant="secondary" onClick={() => onIncrement(amt)}>
            +{amt >= 1000 ? `${amt / 1000}L` : `${amt}ml`}
          </Button>
        ))}
        {water > 0 && <Button size="sm" variant="ghost" onClick={() => onSet(0)} className="text-muted ml-auto">Reset</Button>}
      </div>
    </HabitCard>
  );
}

function StepsTracker({ steps, onUpdate }: { steps: number; onUpdate: (n: number) => void }) {
  const done = steps >= GOALS.steps.target;

  return (
    <HabitCard
      icon={GOALS.steps.icon}
      label={GOALS.steps.label}
      done={done}
      right={
        <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums">
          <span className={done ? 'text-green' : 'text-foreground'}>{steps.toLocaleString()}</span>
          <span className="text-muted/60"> / {GOALS.steps.target.toLocaleString()}</span>
        </span>
      }
    >
      <ProgressBar value={steps} max={GOALS.steps.target} color={done ? 'bg-green' : 'bg-accent'} />
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-1.5">
          {steps >= 1000 && <Button size="sm" variant="secondary" onClick={() => onUpdate(steps - 1000)}>-1k</Button>}
          <Button size="sm" variant="secondary" onClick={() => onUpdate(steps + 1000)}>+1k</Button>
          <Button size="sm" variant="secondary" onClick={() => onUpdate(steps + 5000)}>+5k</Button>
        </div>
        {steps > 0 && <Button size="sm" variant="ghost" onClick={() => onUpdate(0)} className="text-muted">Reset</Button>}
      </div>
    </HabitCard>
  );
}

function WorkoutTracker({ count, onUpdate }: { count: number; onUpdate: (v: number) => void }) {
  const { userId } = useUser();
  const [weekTotal, setWeekTotal] = useState(0);
  const supabase = createClient();

  const isRestDay = count === -1;
  const dailyDone = isWorkoutDone(count);

  useEffect(() => {
    async function fetchWeek() {
      const now = new Date();
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const { data } = await supabase.from('daily_logs').select('workout_count').eq('user_id', userId).gte('date', toLocalDateStr(monday)).lte('date', toLocalDateStr(sunday));
      if (data) setWeekTotal(data.reduce((sum: number, d: { workout_count: number }) => sum + Math.max(d.workout_count || 0, 0), 0));
    }
    fetchWeek();
  }, [userId, count, supabase]);

  const weekDone = weekTotal >= 7;

  return (
    <HabitCard
      icon={GOALS.workout.icon}
      label={GOALS.workout.label}
      done={dailyDone}
      right={
        <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums">
          {isRestDay ? (
            <span className="text-blue">Rest day</span>
          ) : count > 0 ? (
            <span className="text-green">{count} workout{count > 1 ? 's' : ''}</span>
          ) : (
            <span className="text-muted/40">-</span>
          )}
        </span>
      }
    >
      {/* Daily: rest day or workout count */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onUpdate(isRestDay ? 0 : -1)}
          className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2 ${
            isRestDay
              ? 'bg-blue/10 text-blue border border-blue/20'
              : 'bg-foreground/[0.04] text-muted border border-transparent hover:bg-foreground/[0.06]'
          }`}
        >
          {isRestDay ? '✓' : ''} Rest day
        </button>
        <div className="flex items-center gap-1.5">
          {count > 0 && <Button size="sm" variant="secondary" onClick={() => onUpdate(count - 1)}>-</Button>}
          <Button size="sm" variant="secondary" onClick={() => onUpdate(Math.max(count, 0) + 1)}>+1</Button>
        </div>
      </div>
      {/* Weekly progress */}
      <div className="pt-2 border-t border-border/30">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-muted/60 font-medium">Semaine</span>
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-[12px] tabular-nums">
            <span className={weekDone ? 'text-green' : 'text-foreground'}>{weekTotal}</span>
            <span className="text-muted/40">/7</span>
          </span>
        </div>
        <ProgressBar value={weekTotal} max={7} color={weekDone ? 'bg-green' : 'bg-accent'} />
      </div>
    </HabitCard>
  );
}

function PagesTracker({ pages, onUpdate }: { pages: number; onUpdate: (n: number) => void }) {
  const done = pages >= GOALS.pages.target;

  return (
    <HabitCard
      icon={GOALS.pages.icon}
      label={GOALS.pages.label}
      done={done}
      right={
        <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums">
          <span className={done ? 'text-green' : 'text-foreground'}>{pages}</span>
          <span className="text-muted/60"> / {GOALS.pages.target}</span>
        </span>
      }
    >
      <ProgressBar value={pages} max={GOALS.pages.target} color={done ? 'bg-green' : 'bg-yellow'} />
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-1.5">
          {pages > 0 && <Button size="sm" variant="secondary" onClick={() => onUpdate(Math.max(0, pages - 1))}>-1</Button>}
          <Button size="sm" variant="secondary" onClick={() => onUpdate(pages + 1)}>+1</Button>
          <Button size="sm" variant="secondary" onClick={() => onUpdate(pages + 5)}>+5</Button>
        </div>
        {pages > 0 && <Button size="sm" variant="ghost" onClick={() => onUpdate(0)} className="text-muted">Reset</Button>}
      </div>
    </HabitCard>
  );
}

function StudyTracker({ minutes, onSave }: { minutes: number; onSave: (n: number) => void }) {
  const [showTimer, setShowTimer] = useState(false);
  const done = minutes >= GOALS.study_minutes.target;

  return (
    <HabitCard
      icon={GOALS.study_minutes.icon}
      label={GOALS.study_minutes.label}
      done={done}
      right={
        <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums">
          <span className={done ? 'text-green' : 'text-foreground'}>{minutes}</span>
          <span className="text-muted/60"> / {GOALS.study_minutes.target}min</span>
        </span>
      }
    >
      <ProgressBar value={minutes} max={GOALS.study_minutes.target} color={done ? 'bg-green' : 'bg-blue'} />
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-1.5">
          {minutes > 0 && <Button size="sm" variant="secondary" onClick={() => onSave(Math.max(0, minutes - 5))}>-5</Button>}
          <Button size="sm" variant="secondary" onClick={() => onSave(minutes + 5)}>+5</Button>
          <Button size="sm" variant="secondary" onClick={() => onSave(minutes + 15)}>+15</Button>
          <Button size="sm" variant="secondary" onClick={() => onSave(minutes + 30)}>+30</Button>
        </div>
      </div>
      <div className="mt-2">
        {showTimer ? (
          <div>
            <Timer targetMinutes={GOALS.study_minutes.target} initialMinutes={minutes} onSave={(m) => { onSave(m); setShowTimer(false); }} />
            <Button size="sm" variant="ghost" className="w-full mt-2 text-muted" onClick={() => setShowTimer(false)}>Fermer</Button>
          </div>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setShowTimer(true)}>Timer</Button>
        )}
      </div>
    </HabitCard>
  );
}

function isCalorieGoalMet(calories: number, target: number, goal: string): boolean {
  if (goal === 'gain') return calories >= target;
  // lose, lean_bulk, maintain: stay at or under target
  return calories <= target;
}

export default function DashboardPage() {
  const { userId, userName, userEmoji } = useUser();
  const { log, loading, updateField, incrementWater } = useDailyLog(userId);
  const { profile, targets } = useProfile(userId);
  const { totals } = useMeals(userId);
  const [myStreak, setMyStreak] = useState(0);
  const supabase2 = createClient();

  useEffect(() => {
    async function fetchMyStreak() {
      const { data } = await supabase2.from('daily_logs').select('date, completed').eq('user_id', userId).order('date', { ascending: true });
      if (data) setMyStreak(computeCurrentStreak(data as { date: string; completed: boolean }[]));
    }
    fetchMyStreak();
  }, [userId, supabase2, log?.completed]);

  const caloriesDone = isCalorieGoalMet(totals.calories, targets.calories, profile.goal);

  const dayNumber = getDayNumber(CHALLENGE_START_DATE);
  const completionPct = log ? getCompletionPercentage(log, caloriesDone) : 0;
  const completedCount = log ? Math.round((completionPct / 100) * 8) : 0;

  if (loading || !log) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4">
        <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
        <span className="text-[13px] text-muted">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pt-3">
        <div>
          <p className="text-[13px] text-muted mb-1">Bonjour {userName} {userEmoji}</p>
          <h1 className="text-[32px] font-bold tracking-tight leading-none">
            Jour <span className="gradient-text font-[family-name:var(--font-dela-gothic)]">{dayNumber}</span>
            <span className="text-muted/30 text-lg font-normal ml-1">/ {CHALLENGE_DAYS}</span>
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <ThemeToggle />
          <button
            onClick={() => { document.cookie = '75j_user_id=;path=/;max-age=0'; window.location.href = '/login'; }}
            className="h-9 px-3 flex items-center text-[11px] text-muted hover:text-foreground rounded-xl bg-card border border-border hover:border-accent/20 transition-all duration-300 active:scale-95"
          >
            Changer
          </button>
        </div>
      </div>

      {/* Hero — Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="flex flex-col items-center py-10" glow={completionPct === 100} accent>
          <ProgressRing value={completionPct} max={100} size={180} strokeWidth={10}>
            <div className="text-center">
              <div className={`font-[family-name:var(--font-jetbrains-mono)] text-[44px] font-bold tracking-tighter leading-none ${completionPct === 100 ? 'gradient-text' : ''}`}>{completionPct}<span className="text-[18px] text-muted/30">%</span></div>
              <div className="text-[11px] text-muted mt-2 font-medium">
                {completionPct === 100 ? '🔥 Parfait !' : `${completedCount}/8 objectifs`}
              </div>
            </div>
          </ProgressRing>
          {myStreak > 0 && (
            <div className="mt-7 flex items-center gap-3 px-6 py-3 rounded-2xl bg-accent/5 border border-accent/15">
              <div className="w-2 h-2 rounded-full bg-accent animate-breathe" />
              <span className="text-[12px] text-accent/70 font-medium">Streak</span>
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-[18px] font-bold gradient-text">{myStreak}</span>
              <span className="text-[12px] text-accent/70 font-medium">jours</span>
            </div>
          )}
        </Card>

        <StreakBattle />
      </div>

      {/* Section label */}
      <div className="flex items-center gap-4">
        <div className="text-[11px] font-bold text-accent/60 uppercase tracking-[0.15em]">Objectifs du jour</div>
        <div className="flex-1 h-[1px] bg-gradient-to-r from-accent/15 to-transparent" />
      </div>

      {/* Habit trackers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <WaterTracker water={log.water_ml} onIncrement={incrementWater} onSet={(v) => updateField('water_ml', v)} />
        <StepsTracker steps={log.steps} onUpdate={(v) => updateField('steps', v)} />
        <WorkoutTracker count={log.workout_count} onUpdate={(v) => updateField('workout_count', v)} />

        <HabitCard icon="🧘" label="Stretching ou Musique" done={log.stretching || log.reinforcement}>
          <div className="flex gap-2">
            <button
              onClick={() => updateField('stretching', !log.stretching)}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2 ${
                log.stretching
                  ? 'bg-green/10 text-green border border-green/20'
                  : 'bg-foreground/[0.04] text-muted border border-transparent hover:bg-foreground/[0.06]'
              }`}
            >
              {log.stretching ? '✓' : ''} Stretching
            </button>
            <button
              onClick={() => updateField('reinforcement', !log.reinforcement)}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2 ${
                log.reinforcement
                  ? 'bg-green/10 text-green border border-green/20'
                  : 'bg-foreground/[0.04] text-muted border border-transparent hover:bg-foreground/[0.06]'
              }`}
            >
              {log.reinforcement ? '✓' : ''} Musique
            </button>
          </div>
        </HabitCard>

        <HabitCard icon="🍽" label="Calories" done={caloriesDone}
          right={
            <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums">
              <span className={
                caloriesDone ? 'text-green' : totals.calories > targets.calories ? 'text-red' : 'text-foreground'
              }>{Math.round(totals.calories)}</span>
              <span className="text-muted/60"> / {targets.calories}</span>
            </span>
          }
        >
          <ProgressBar
            value={totals.calories}
            max={targets.calories}
            color={
              totals.calories > targets.calories
                ? 'bg-red'
                : caloriesDone ? 'bg-green' : 'bg-accent'
            }
          />
          <div className={`text-[11px] mt-2 ${totals.calories > targets.calories && profile.goal === 'lose' ? 'text-red/70 font-semibold' : 'text-muted/50'}`}>
            {profile.goal === 'lose'
              ? totals.calories > targets.calories
                ? `Dépassé de ${Math.round(totals.calories - targets.calories)} kcal`
                : totals.calories > 0
                  ? `Encore ${Math.round(targets.calories - totals.calories)} kcal dispo`
                  : 'Reste en dessous'
              : profile.goal === 'maintain'
                ? 'Reste autour (±10%)'
                : 'Atteins ta cible'}
          </div>
        </HabitCard>

        <PagesTracker pages={log.pages} onUpdate={(v) => updateField('pages', v)} />
        <StudyTracker minutes={log.study_minutes} onSave={(v) => updateField('study_minutes', v)} />

        {/* Alcohol */}
        <HabitCard icon={GOALS.alcohol.icon} label="Alcool" done={!log.alcohol}>
          <div className="flex gap-2">
            <button
              onClick={() => updateField('alcohol', false)}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                !log.alcohol
                  ? 'bg-green/10 text-green border border-green/20'
                  : 'bg-foreground/[0.04] text-muted border border-transparent hover:bg-foreground/[0.06]'
              }`}
            >
              Sobre
            </button>
            <button
              onClick={() => updateField('alcohol', true)}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                log.alcohol
                  ? 'bg-yellow/10 text-yellow border border-yellow/20'
                  : 'bg-foreground/[0.04] text-muted border border-transparent hover:bg-foreground/[0.06]'
              }`}
            >
              Event
            </button>
          </div>
        </HabitCard>
      </div>
    </div>
  );
}
