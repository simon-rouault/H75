import type { SupabaseClient } from '@supabase/supabase-js';
import { toLocalDateStr } from './dates';

function yesterday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return toLocalDateStr(d);
}

function tomorrow(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return toLocalDateStr(d);
}

export async function updateStreak(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  completed: boolean
) {
  if (completed) {
    // Check if yesterday or tomorrow have an active streak we can extend
    const yesterdayDate = yesterday(date);
    const tomorrowDate = tomorrow(date);

    // Find active streak that ends yesterday (extend forward)
    const { data: prevStreak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .eq('end_date', yesterdayDate)
      .single();

    // Find active streak that starts tomorrow (extend backward)
    const { data: nextStreak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .eq('start_date', tomorrowDate)
      .single();

    if (prevStreak && nextStreak) {
      // Merge two streaks
      await supabase
        .from('streaks')
        .update({
          end_date: nextStreak.end_date,
          length: prevStreak.length + 1 + nextStreak.length,
        })
        .eq('id', prevStreak.id);
      await supabase.from('streaks').delete().eq('id', nextStreak.id);
    } else if (prevStreak) {
      // Extend previous streak
      await supabase
        .from('streaks')
        .update({
          end_date: date,
          length: prevStreak.length + 1,
        })
        .eq('id', prevStreak.id);
    } else if (nextStreak) {
      // Extend next streak backward
      await supabase
        .from('streaks')
        .update({
          start_date: date,
          length: nextStreak.length + 1,
        })
        .eq('id', nextStreak.id);
    } else {
      // Create new streak of length 1
      await supabase.from('streaks').insert({
        user_id: userId,
        start_date: date,
        end_date: date,
        length: 1,
        active: true,
      });
    }
  } else {
    // Day became incomplete — shrink or remove streak containing this date
    const { data: streaks } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .lte('start_date', date)
      .gte('end_date', date);

    if (streaks && streaks.length > 0) {
      const streak = streaks[0];
      if (streak.length === 1) {
        // Delete single-day streak
        await supabase.from('streaks').delete().eq('id', streak.id);
      } else if (streak.start_date === date) {
        // Shrink from start
        await supabase
          .from('streaks')
          .update({
            start_date: tomorrow(date),
            length: streak.length - 1,
          })
          .eq('id', streak.id);
      } else if (streak.end_date === date) {
        // Shrink from end
        await supabase
          .from('streaks')
          .update({
            end_date: yesterday(date),
            length: streak.length - 1,
          })
          .eq('id', streak.id);
      } else {
        // Split streak in two
        const beforeLength = Math.round(
          (new Date(date + 'T00:00:00').getTime() - new Date(streak.start_date + 'T00:00:00').getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const afterLength = streak.length - beforeLength - 1;

        // Update existing to be the "before" part
        await supabase
          .from('streaks')
          .update({
            end_date: yesterday(date),
            length: beforeLength,
          })
          .eq('id', streak.id);

        // Create the "after" part
        if (afterLength > 0) {
          await supabase.from('streaks').insert({
            user_id: userId,
            start_date: tomorrow(date),
            end_date: streak.end_date,
            length: afterLength,
            active: true,
          });
        }
      }
    }
  }
}
