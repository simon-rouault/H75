'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Streak } from '@/types/database';

export function useStreak(userId: string) {
  const [current, setCurrent] = useState<Streak | null>(null);
  const [best, setBest] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchStreak = useCallback(async () => {
    setLoading(true);
    // Get active streak
    const { data: active } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .single();

    if (active) setCurrent(active as Streak);

    // Get best streak
    const { data: all } = await supabase
      .from('streaks')
      .select('length')
      .eq('user_id', userId)
      .order('length', { ascending: false })
      .limit(1)
      .single();

    if (all) setBest(all.length);
    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return { current, best, loading, refetch: fetchStreak };
}
