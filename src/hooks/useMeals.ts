'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Meal, MacroTargets } from '@/types/database';
import { today } from '@/lib/dates';

export function useMeals(userId: string, date: string = today()) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: true });

    setMeals((data as Meal[]) || []);
    setLoading(false);
  }, [userId, date, supabase]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const totals: MacroTargets = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const addMeal = useCallback(
    async (meal: Omit<Meal, 'id' | 'created_at'>) => {
      const { data } = await supabase.from('meals').insert(meal).select().single();
      if (data) setMeals((prev) => [...prev, data as Meal]);
      return data as Meal | null;
    },
    [supabase]
  );

  const deleteMeal = useCallback(
    async (mealId: string) => {
      await supabase.from('meals').delete().eq('id', mealId);
      setMeals((prev) => prev.filter((m) => m.id !== mealId));
    },
    [supabase]
  );

  return { meals, totals, loading, addMeal, deleteMeal, refetch: fetchMeals };
}

export function useMealHistory(userId: string) {
  const [history, setHistory] = useState<Record<string, Meal[]>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .neq('date', today())
      .order('date', { ascending: false })
      .order('created_at', { ascending: true });

    const grouped: Record<string, Meal[]> = {};
    for (const meal of (data as Meal[]) || []) {
      if (!grouped[meal.date]) grouped[meal.date] = [];
      grouped[meal.date].push(meal);
    }
    setHistory(grouped);
    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, refetch: fetchHistory };
}
