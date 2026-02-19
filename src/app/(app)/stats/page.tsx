'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { CHALLENGE_START_DATE, CHALLENGE_DAYS } from '@/lib/constants';
import { daysArray, today } from '@/lib/dates';
import { createClient } from '@/lib/supabase/client';
import type { DailyLog } from '@/types/database';

function CalendarGrid({ logs, startDate }: { logs: DailyLog[]; startDate: string }) {
  const days = daysArray(startDate, CHALLENGE_DAYS);
  const logMap = new Map(logs.map((l) => [l.date, l]));
  const todayStr = today();

  const firstDay = new Date(startDate + 'T00:00:00').getDay();
  const padDays = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} className="text-[10px] text-muted/50 text-center font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: padDays }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}
        {days.map((date) => {
          const log = logMap.get(date);
          const isFuture = date > todayStr;
          const isCompleted = log?.completed;
          const isToday = date === todayStr;

          let bg = 'bg-foreground/[0.03]';
          if (!isFuture) bg = isCompleted ? 'bg-green' : 'bg-red/40';

          return (
            <div
              key={date}
              className={`aspect-square rounded-[5px] transition-all ${bg} ${isToday ? 'ring-[1.5px] ring-accent ring-offset-1 ring-offset-card' : ''}`}
              title={`${date}: ${isCompleted ? 'Complete' : isFuture ? 'A venir' : 'Manque'}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, gradient }: { label: string; value: string | number; sub?: string; gradient?: boolean }) {
  return (
    <Card className="text-center py-6">
      <div className="text-[11px] text-muted font-semibold uppercase tracking-[0.1em] mb-2">{label}</div>
      <div className={`font-[family-name:var(--font-jetbrains-mono)] text-3xl font-bold ${gradient ? 'gradient-text' : 'text-green'}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted mt-1">{sub}</div>}
    </Card>
  );
}

function ComparisonRow({ label, simonVal, emmaVal }: { label: string; simonVal: string | number; emmaVal: string | number }) {
  return (
    <div className="flex items-center py-3.5 border-b border-foreground/[0.04] last:border-0">
      <div className="flex-1 text-[13px] text-muted">{label}</div>
      <div className="w-20 text-center font-[family-name:var(--font-jetbrains-mono)] text-[13px] font-bold">{simonVal}</div>
      <div className="w-20 text-center font-[family-name:var(--font-jetbrains-mono)] text-[13px] font-bold">{emmaVal}</div>
    </div>
  );
}

function computeStreaks(logs: { date: string; completed: boolean }[], startDate: string): { current: number; best: number } {
  const todayStr = today();
  const completedSet = new Set(logs.filter((l) => l.completed).map((l) => l.date));

  let best = 0;
  let current = 0;
  let streak = 0;

  // Walk through all days from start to today
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(todayStr + 'T00:00:00');
  const d = new Date(start);

  while (d <= end) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (completedSet.has(dateStr)) {
      streak++;
      if (streak > best) best = streak;
    } else {
      streak = 0;
    }
    d.setDate(d.getDate() + 1);
  }
  current = streak; // streak at the end = current streak

  return { current, best };
}

function getElapsedDays(startDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const now = new Date(today() + 'T00:00:00');
  return Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export default function StatsPage() {
  const { userId } = useUser();

  const [myLogs, setMyLogs] = useState<DailyLog[]>([]);
  const [simonLogs, setSimonLogs] = useState<{ date: string; completed: boolean }[]>([]);
  const [emmaLogs, setEmmaLogs] = useState<{ date: string; completed: boolean }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: logs } = await supabase.from('daily_logs').select('*').eq('user_id', userId).order('date', { ascending: true });
      if (logs) setMyLogs(logs as DailyLog[]);

      for (const uid of ['simon', 'emma']) {
        const { data: uLogs } = await supabase.from('daily_logs').select('date, completed').eq('user_id', uid).order('date', { ascending: true });
        const parsed = (uLogs || []) as { date: string; completed: boolean }[];
        if (uid === 'simon') setSimonLogs(parsed);
        else setEmmaLogs(parsed);
      }
    }
    fetchData();
  }, [userId, supabase]);

  const elapsed = getElapsedDays(CHALLENGE_START_DATE);
  const myCompletedDays = myLogs.filter((l) => l.completed).length;
  const successRate = elapsed > 0 ? Math.round((myCompletedDays / elapsed) * 100) : 0;
  const myStreaks = computeStreaks(myLogs, CHALLENGE_START_DATE);

  const simonCompleted = simonLogs.filter((l) => l.completed).length;
  const emmaCompleted = emmaLogs.filter((l) => l.completed).length;
  const simonStreaks = computeStreaks(simonLogs, CHALLENGE_START_DATE);
  const emmaStreaks = computeStreaks(emmaLogs, CHALLENGE_START_DATE);

  return (
    <div className="space-y-6">
      <PageHeader title="Statistiques" />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Streak actuel" value={myStreaks.current} sub="jours" gradient />
        <StatCard label="Taux de reussite" value={`${successRate}%`} sub={`${myCompletedDays}/${elapsed} jours`} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Meilleur streak" value={myStreaks.best} sub="jours" gradient />
        <StatCard label="Jours completes" value={myCompletedDays} sub={`sur ${elapsed} jours`} />
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="text-[11px] font-bold text-accent/60 uppercase tracking-[0.12em]">Calendrier</div>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-accent/15 to-transparent" />
        </div>
        <CalendarGrid logs={myLogs} startDate={CHALLENGE_START_DATE} />
        <div className="flex items-center justify-center gap-6 mt-5 text-[11px] text-muted">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-[3px] bg-green" /> Complete</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-[3px] bg-red/40" /> Manque</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-[3px] bg-foreground/[0.03]" /> A venir</div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-[11px] font-bold text-accent/60 uppercase tracking-[0.12em]">Simon vs Emma</div>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-accent/15 to-transparent" />
        </div>
        <div className="flex items-center py-2.5 border-b border-foreground/[0.04]">
          <div className="flex-1" />
          <div className="w-20 text-center text-[13px] font-semibold">🦁</div>
          <div className="w-20 text-center text-[13px] font-semibold">🦊</div>
        </div>
        <ComparisonRow label="Streak" simonVal={simonStreaks.current} emmaVal={emmaStreaks.current} />
        <ComparisonRow label="Jours completes" simonVal={simonCompleted} emmaVal={emmaCompleted} />
        <ComparisonRow
          label="Taux de reussite"
          simonVal={elapsed > 0 ? `${Math.round((simonCompleted / elapsed) * 100)}%` : '-'}
          emmaVal={elapsed > 0 ? `${Math.round((emmaCompleted / elapsed) * 100)}%` : '-'}
        />
      </Card>
    </div>
  );
}
