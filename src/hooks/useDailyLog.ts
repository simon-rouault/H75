'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DailyLog, HabitField } from '@/types/database';
import { today } from '@/lib/dates';
import { isDayCompleted } from '@/lib/streak-engine';
import { updateStreak } from '@/lib/streak-updater';

const DEFAULT_LOG: Omit<DailyLog, 'id' | 'user_id' | 'date' | 'created_at' | 'updated_at'> = {
  water_ml: 0,
  steps: 0,
  workout_count: 0,
  stretching: false,
  reinforcement: false,
  pages: 0,
  study_minutes: 0,
  alcohol: false,
  completed: false,
  streak_day: 0,
};

export function useDailyLog(userId: string, date: string = today()) {
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchLog = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (data) {
      setLog(data as DailyLog);
    } else {
      // Create a new log for today
      const { data: newLog } = await supabase
        .from('daily_logs')
        .insert({ user_id: userId, date, ...DEFAULT_LOG })
        .select()
        .single();
      if (newLog) setLog(newLog as DailyLog);
    }
    setLoading(false);
  }, [userId, date, supabase]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  const updateField = useCallback(
    async (field: HabitField, value: number | boolean | string | null) => {
      if (!log) return;

      const updates: Record<string, unknown> = { [field]: value };
      const updatedLog = { ...log, [field]: value };

      // Recalculate completion
      updates.completed = isDayCompleted(updatedLog as DailyLog);

      const wasCompleted = log.completed;
      const { data } = await supabase
        .from('daily_logs')
        .update(updates)
        .eq('id', log.id)
        .select()
        .single();

      if (data) {
        setLog(data as DailyLog);
        const nowCompleted = (data as DailyLog).completed;
        if (wasCompleted !== nowCompleted) {
          await updateStreak(supabase, userId, date, nowCompleted);
        }
      }
    },
    [log, supabase, userId, date]
  );

  const incrementWater = useCallback(
    (amount: number) => {
      if (!log) return;
      updateField('water_ml', log.water_ml + amount);
    },
    [log, updateField]
  );

  return { log, loading, updateField, incrementWater, refetch: fetchLog };
}
