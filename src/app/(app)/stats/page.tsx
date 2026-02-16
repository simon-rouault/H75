'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useStreak } from '@/hooks/useStreak';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { CHALLENGE_START_DATE, CHALLENGE_DAYS } from '@/lib/constants';
import { daysArray } from '@/lib/dates';
import { createClient } from '@/lib/supabase/client';
import type { DailyLog } from '@/types/database';

function CalendarGrid({ logs, startDate }: { logs: DailyLog[]; startDate: string }) {
  const days = daysArray(startDate, CHALLENGE_DAYS);
  const logMap = new Map(logs.map((l) => [l.date, l]));
  const todayStr = new Date().toISOString().split('T')[0];

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

export default function StatsPage() {
  const { userId } = useUser();
  const { current, best } = useStreak(userId);

  const [myLogs, setMyLogs] = useState<DailyLog[]>([]);
  const [simonStats, setSimonStats] = useState({ streak: 0, completedDays: 0, total: 0 });
  const [emmaStats, setEmmaStats] = useState({ streak: 0, completedDays: 0, total: 0 });
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: logs } = await supabase.from('daily_logs').select('*').eq('user_id', userId).order('date', { ascending: true });
      if (logs) setMyLogs(logs as DailyLog[]);

      for (const uid of ['simon', 'emma']) {
        const { data: uLogs } = await supabase.from('daily_logs').select('completed').eq('user_id', uid);
        const { data: uStreak } = await supabase.from('streaks').select('length').eq('user_id', uid).eq('active', true).single();
        const completedDays = uLogs?.filter((l: { completed: boolean }) => l.completed).length || 0;
        const total = uLogs?.length || 0;
        const streak = uStreak?.length || 0;
        if (uid === 'simon') setSimonStats({ streak, completedDays, total });
        else setEmmaStats({ streak, completedDays, total });
      }
    }
    fetchData();
  }, [userId, supabase]);

  const myCompletedDays = myLogs.filter((l) => l.completed).length;
  const successRate = myLogs.length > 0 ? Math.round((myCompletedDays / myLogs.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Statistiques" />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Meilleur streak" value={best} sub="jours" gradient />
        <StatCard label="Taux de reussite" value={`${successRate}%`} sub={`${myCompletedDays}/${myLogs.length} jours`} />
      </div>

      {current && <StatCard label="Streak actuelle" value={current.length} gradient />}

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
        <ComparisonRow label="Streak" simonVal={simonStats.streak} emmaVal={emmaStats.streak} />
        <ComparisonRow label="Jours completes" simonVal={simonStats.completedDays} emmaVal={emmaStats.completedDays} />
        <ComparisonRow
          label="Taux de reussite"
          simonVal={simonStats.total > 0 ? `${Math.round((simonStats.completedDays / simonStats.total) * 100)}%` : '-'}
          emmaVal={emmaStats.total > 0 ? `${Math.round((emmaStats.completedDays / emmaStats.total) * 100)}%` : '-'}
        />
      </Card>
    </div>
  );
}
