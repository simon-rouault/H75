import { GOALS } from './constants';
import type { DailyLog } from '@/types/database';

export function isDayCompleted(log: DailyLog): boolean {
  return (
    log.water_ml >= GOALS.water_ml.target &&
    log.steps >= GOALS.steps.target &&
    log.stretching === true &&
    log.reinforcement === true &&
    log.pages >= GOALS.pages.target &&
    log.study_minutes >= GOALS.study_minutes.target &&
    log.alcohol === false
    // workout is weekly — checked separately
  );
}

export function getCompletionPercentage(log: DailyLog): number {
  let completed = 0;
  let total = 7; // 7 daily trackable items (workout checked weekly)

  if (log.water_ml >= GOALS.water_ml.target) completed++;
  if (log.steps >= GOALS.steps.target) completed++;
  if (log.stretching) completed++;
  if (log.reinforcement) completed++;
  if (log.pages >= GOALS.pages.target) completed++;
  if (log.study_minutes >= GOALS.study_minutes.target) completed++;
  if (!log.alcohol) completed++;

  return Math.round((completed / total) * 100);
}

export function getCompletedItems(log: DailyLog): Record<string, boolean> {
  return {
    water_ml: log.water_ml >= GOALS.water_ml.target,
    steps: log.steps >= GOALS.steps.target,
    stretching: log.stretching,
    reinforcement: log.reinforcement,
    pages: log.pages >= GOALS.pages.target,
    study_minutes: log.study_minutes >= GOALS.study_minutes.target,
    alcohol: !log.alcohol,
  };
}

export function getDayNumber(startDate: string, currentDate?: string): number {
  if (!currentDate) {
    const now = new Date();
    currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
  return d.toISOString().split('T')[0];
}

export function getSunday(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 0 : 7 - day);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}
