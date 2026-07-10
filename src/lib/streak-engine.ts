import { GOALS } from './constants';
import { toLocalDateStr } from './dates';
import type { DailyLog } from '@/types/database';

// workout_count: 0 = not addressed, -1 = rest day, >= 1 = workouts done
export function isWorkoutDone(workoutCount: number): boolean {
  return workoutCount !== 0; // rest day (-1) or actual workout (>=1) both count
}

// The 6 daily objectives: water, steps, sport, personal goal (flex/music), reading, calories.
export const OBJECTIVE_COUNT = 6;

export function isDayCompleted(log: DailyLog, caloriesDone?: boolean): boolean {
  return (
    log.water_ml >= GOALS.water_ml.target &&
    log.steps >= GOALS.steps.target &&
    (log.stretching === true || log.reinforcement === true) &&
    log.pages >= GOALS.pages.target &&
    (caloriesDone ?? true) &&
    isWorkoutDone(log.workout_count)
  );
}

export function getObjectiveCount(): number {
  return OBJECTIVE_COUNT;
}

export function getCompletionPercentage(log: DailyLog, caloriesDone?: boolean): number {
  let completed = 0;

  if (log.water_ml >= GOALS.water_ml.target) completed++;
  if (log.steps >= GOALS.steps.target) completed++;
  if (isWorkoutDone(log.workout_count)) completed++;
  if (log.stretching || log.reinforcement) completed++;
  if (log.pages >= GOALS.pages.target) completed++;
  if (caloriesDone) completed++;

  return Math.round((completed / OBJECTIVE_COUNT) * 100);
}

/**
 * Streak = nombre de jours complétés consécutifs jusqu'à aujourd'hui.
 * La journée EN COURS ne casse pas le streak tant qu'elle n'est pas terminée :
 * un jour non complété ne remet à zéro que s'il est déjà passé (avant aujourd'hui).
 */
export function computeStreaks(
  logs: { date: string; completed: boolean }[],
  startDate: string,
  currentDate?: string,
): { current: number; best: number } {
  const todayStr = currentDate ?? toLocalDateStr(new Date());
  const completedSet = new Set(logs.filter((l) => l.completed).map((l) => l.date));
  let best = 0;
  let streak = 0;
  const d = new Date(startDate + 'T00:00:00');
  const end = new Date(todayStr + 'T00:00:00');
  while (d <= end) {
    const ds = toLocalDateStr(d);
    if (completedSet.has(ds)) {
      streak++;
      if (streak > best) best = streak;
    } else if (ds === todayStr) {
      // Journée en cours : pas encore ratée, on ne casse pas le streak.
    } else {
      streak = 0;
    }
    d.setDate(d.getDate() + 1);
  }
  return { current: streak, best };
}

export function getDayNumber(startDate: string, currentDate?: string): number {
  if (!currentDate) {
    currentDate = toLocalDateStr(new Date());
  }
  const start = new Date(startDate + 'T00:00:00');
  const current = new Date(currentDate + 'T00:00:00');
  const diff = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff + 1, 1);
}
