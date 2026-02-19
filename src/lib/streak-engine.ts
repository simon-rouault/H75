import { GOALS } from './constants';
import { toLocalDateStr } from './dates';
import type { DailyLog } from '@/types/database';

// workout_count: 0 = not addressed, -1 = rest day, >= 1 = workouts done
export function isWorkoutDone(workoutCount: number): boolean {
  return workoutCount !== 0; // rest day (-1) or actual workout (>=1) both count
}

export function isDayCompleted(log: DailyLog, caloriesDone?: boolean): boolean {
  return (
    log.water_ml >= GOALS.water_ml.target &&
    log.steps >= GOALS.steps.target &&
    (log.stretching === true || log.reinforcement === true) &&
    log.pages >= GOALS.pages.target &&
    log.study_minutes >= GOALS.study_minutes.target &&
    log.alcohol === false &&
    (caloriesDone ?? true) &&
    isWorkoutDone(log.workout_count)
  );
}

export function getCompletionPercentage(log: DailyLog, caloriesDone?: boolean): number {
  let completed = 0;
  const total = 8; // water, steps, workout, stretching/musique, pages, study, alcohol, calories

  if (log.water_ml >= GOALS.water_ml.target) completed++;
  if (log.steps >= GOALS.steps.target) completed++;
  if (isWorkoutDone(log.workout_count)) completed++;
  if (log.stretching || log.reinforcement) completed++;
  if (log.pages >= GOALS.pages.target) completed++;
  if (log.study_minutes >= GOALS.study_minutes.target) completed++;
  if (!log.alcohol) completed++;
  if (caloriesDone) completed++;

  return Math.round((completed / total) * 100);
}

export function getCompletedItems(log: DailyLog, caloriesDone?: boolean): Record<string, boolean> {
  return {
    water_ml: log.water_ml >= GOALS.water_ml.target,
    steps: log.steps >= GOALS.steps.target,
    workout: isWorkoutDone(log.workout_count),
    stretching_renfo: log.stretching || log.reinforcement,
    pages: log.pages >= GOALS.pages.target,
    study_minutes: log.study_minutes >= GOALS.study_minutes.target,
    alcohol: !log.alcohol,
    calories: caloriesDone ?? false,
  };
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

export function getWeekWorkoutTotal(counts: number[]): number {
  return counts.reduce((sum, c) => sum + c, 0);
}

export function getMonday(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return toLocalDateStr(d);
}

export function getSunday(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 0 : 7 - day);
  d.setDate(diff);
  return toLocalDateStr(d);
}
