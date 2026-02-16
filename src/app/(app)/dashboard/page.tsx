'use client';

import { useUser } from '@/hooks/useUser';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useStreak } from '@/hooks/useStreak';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Timer } from '@/components/ui/Timer';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { GOALS, CHALLENGE_DAYS, CHALLENGE_START_DATE, WATER_INCREMENTS } from '@/lib/constants';
import { getDayNumber, getCompletionPercentage } from '@/lib/streak-engine';
import { today } from '@/lib/dates';
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

function StreakBattle() {
  const [simonStreak, setSimonStreak] = useState(0);
  const [emmaStreak, setEmmaStreak] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data: s } = await supabase.from('streaks').select('length').eq('user_id', 'simon').eq('active', true).single();
      const { data: e } = await supabase.from('streaks').select('length').eq('user_id', 'emma').eq('active', true).single();
      if (s) setSimonStreak(s.length);
      if (e) setEmmaStreak(e.length);
    }
    fetch();
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
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const done = water >= GOALS.water_ml.target;

  return (
    <HabitCard
      icon={GOALS.water_ml.icon}
      label={GOALS.water_ml.label}
      done={done}
      right={
        <button onClick={() => { setVal(String(water)); setEditing(true); }} className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums text-muted hover:text-foreground transition-colors">
          <span className={done ? 'text-green' : 'text-foreground'}>{(water / 1000).toFixed(1)}L</span>
          <span className="text-muted/60"> / {GOALS.water_ml.target / 1000}L</span>
        </button>
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
      <Modal open={editing} onClose={() => setEditing(false)} title="Eau (ml)">
        <div className="text-center mb-3">
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-accent">{val || '0'}</span>
          <span className="text-muted/50 text-sm ml-1">ml</span>
        </div>
        <Input type="number" inputMode="numeric" pattern="[0-9]*" value={val} onChange={(e) => setVal(e.target.value)} placeholder="2000" autoFocus className="!text-[18px] !text-center" />
        <Button className="w-full mt-4" onClick={() => { onSet(parseInt(val) || 0); setEditing(false); }}>Sauvegarder</Button>
      </Modal>
    </HabitCard>
  );
}

function StepsTracker({ steps, onUpdate }: { steps: number; onUpdate: (n: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const done = steps >= GOALS.steps.target;

  return (
    <HabitCard
      icon={GOALS.steps.icon}
      label={GOALS.steps.label}
      done={done}
      right={
        <button onClick={() => { setVal(String(steps)); setEditing(true); }} className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums text-muted hover:text-foreground transition-colors">
          <span className={done ? 'text-green' : 'text-foreground'}>{steps.toLocaleString()}</span>
          <span className="text-muted/60"> / {GOALS.steps.target.toLocaleString()}</span>
        </button>
      }
    >
      <ProgressBar value={steps} max={GOALS.steps.target} color={done ? 'bg-green' : 'bg-accent'} />
      <Modal open={editing} onClose={() => setEditing(false)} title="Nombre de pas">
        <div className="text-center mb-3">
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-accent">{val ? parseInt(val).toLocaleString() : '0'}</span>
          <span className="text-muted/50 text-sm ml-1">pas</span>
        </div>
        <Input type="number" inputMode="numeric" pattern="[0-9]*" value={val} onChange={(e) => setVal(e.target.value)} placeholder="10000" autoFocus className="!text-[18px] !text-center" />
        <Button className="w-full mt-4" onClick={() => { onUpdate(parseInt(val) || 0); setEditing(false); }}>Sauvegarder</Button>
      </Modal>
    </HabitCard>
  );
}

function WorkoutTracker({ count, onUpdate }: { count: number; onUpdate: (v: number) => void }) {
  const { userId } = useUser();
  const [weekTotal, setWeekTotal] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchWeek() {
      const now = new Date();
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const { data } = await supabase.from('daily_logs').select('workout_count').eq('user_id', userId).gte('date', monday.toISOString().split('T')[0]).lte('date', sunday.toISOString().split('T')[0]);
      if (data) setWeekTotal(data.reduce((sum: number, d: { workout_count: number }) => sum + (d.workout_count || 0), 0));
    }
    fetchWeek();
  }, [userId, count, supabase]);

  const done = weekTotal >= 7;

  return (
    <HabitCard
      icon={GOALS.workout.icon}
      label={GOALS.workout.label}
      done={done}
      right={
        <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums">
          <span className={done ? 'text-green' : 'text-foreground'}>{weekTotal}</span>
          <span className="text-muted/60">/7 sem.</span>
        </span>
      }
    >
      <ProgressBar value={weekTotal} max={7} color={done ? 'bg-green' : 'bg-accent'} />
      <div className="flex items-center justify-between mt-3">
        <span className="text-[12px] text-muted">Aujourd&apos;hui : <span className="font-[family-name:var(--font-jetbrains-mono)] text-foreground">{count}</span></span>
        <div className="flex gap-1.5">
          {count > 0 && <Button size="sm" variant="secondary" onClick={() => onUpdate(count - 1)}>-</Button>}
          <Button size="sm" variant="secondary" onClick={() => onUpdate(count + 1)}>+</Button>
        </div>
      </div>
    </HabitCard>
  );
}

function PagesTracker({ pages, onUpdate }: { pages: number; onUpdate: (n: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const done = pages >= GOALS.pages.target;

  return (
    <HabitCard
      icon={GOALS.pages.icon}
      label={GOALS.pages.label}
      done={done}
      right={
        <button onClick={() => { setVal(String(pages)); setEditing(true); }} className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums text-muted hover:text-foreground transition-colors">
          <span className={done ? 'text-green' : 'text-foreground'}>{pages}</span>
          <span className="text-muted/60"> / {GOALS.pages.target}</span>
        </button>
      }
    >
      <ProgressBar value={pages} max={GOALS.pages.target} color={done ? 'bg-green' : 'bg-yellow'} />
      <Modal open={editing} onClose={() => setEditing(false)} title="Pages lues">
        <div className="text-center mb-3">
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-accent">{val || '0'}</span>
          <span className="text-muted/50 text-sm ml-1">pages</span>
        </div>
        <Input type="number" inputMode="numeric" pattern="[0-9]*" value={val} onChange={(e) => setVal(e.target.value)} placeholder="15" autoFocus className="!text-[18px] !text-center" />
        <Button className="w-full mt-4" onClick={() => { onUpdate(parseInt(val) || 0); setEditing(false); }}>Sauvegarder</Button>
      </Modal>
    </HabitCard>
  );
}

function StudyTracker({ minutes, onSave }: { minutes: number; onSave: (n: number) => void }) {
  const [showTimer, setShowTimer] = useState(false);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const done = minutes >= GOALS.study_minutes.target;

  return (
    <HabitCard
      icon={GOALS.study_minutes.icon}
      label={GOALS.study_minutes.label}
      done={done}
      right={
        <button onClick={() => { setVal(String(minutes)); setEditing(true); }} className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums text-muted hover:text-foreground transition-colors">
          <span className={done ? 'text-green' : 'text-foreground'}>{minutes}</span>
          <span className="text-muted/60"> / {GOALS.study_minutes.target}min</span>
        </button>
      }
    >
      <ProgressBar value={minutes} max={GOALS.study_minutes.target} color={done ? 'bg-green' : 'bg-blue'} />
      <div className="mt-3">
        {showTimer ? (
          <div>
            <Timer targetMinutes={GOALS.study_minutes.target} initialMinutes={minutes} onSave={(m) => { onSave(m); setShowTimer(false); }} />
            <Button size="sm" variant="ghost" className="w-full mt-2 text-muted" onClick={() => setShowTimer(false)}>Fermer</Button>
          </div>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setShowTimer(true)}>Timer</Button>
        )}
      </div>
      <Modal open={editing} onClose={() => setEditing(false)} title="Minutes d'étude">
        <div className="text-center mb-3">
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-accent">{val || '0'}</span>
          <span className="text-muted/50 text-sm ml-1">min</span>
        </div>
        <Input type="number" inputMode="numeric" pattern="[0-9]*" value={val} onChange={(e) => setVal(e.target.value)} placeholder="30" autoFocus className="!text-[18px] !text-center" />
        <Button className="w-full mt-4" onClick={() => { onSave(parseInt(val) || 0); setEditing(false); }}>Sauvegarder</Button>
      </Modal>
    </HabitCard>
  );
}

export default function DashboardPage() {
  const { userId, userName, userEmoji } = useUser();
  const { log, loading, updateField, incrementWater } = useDailyLog(userId);
  const { current } = useStreak(userId);

  const dayNumber = getDayNumber(CHALLENGE_START_DATE);
  const completionPct = log ? getCompletionPercentage(log) : 0;
  const completedCount = log ? Math.round((completionPct / 100) * 7) : 0;

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
                {completionPct === 100 ? '🔥 Parfait !' : `${completedCount}/7 objectifs`}
              </div>
            </div>
          </ProgressRing>
          {current && (
            <div className="mt-7 flex items-center gap-3 px-6 py-3 rounded-2xl bg-accent/5 border border-accent/15">
              <div className="w-2 h-2 rounded-full bg-accent animate-breathe" />
              <span className="text-[12px] text-accent/70 font-medium">Streak</span>
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-[18px] font-bold gradient-text">{current.length}</span>
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

        <HabitCard icon={GOALS.stretching.icon} label={GOALS.stretching.label} done={log.stretching}
          right={<Checkbox checked={log.stretching} onChange={(v) => updateField('stretching', v)} />}
        />

        <HabitCard icon={GOALS.reinforcement.icon} label={GOALS.reinforcement.label} done={log.reinforcement}
          right={<Checkbox checked={log.reinforcement} onChange={(v) => updateField('reinforcement', v)} />}
        />

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
