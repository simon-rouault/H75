export interface User {
  id: string;
  name: string;
  emoji: string;
  macro_targets: MacroTargets;
  challenge_start_date: string;
  challenge_extra_days: number;
  created_at: string;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  water_ml: number;
  steps: number;
  workout_count: number;
  stretching: boolean;
  reinforcement: boolean;
  pages: number;
  study_minutes: number;
  alcohol: boolean;
  completed: boolean;
  streak_day: number;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  input_type: 'photo' | 'text' | 'voice';
  ai_raw_response: string | null;
  manually_adjusted: boolean;
  created_at: string;
}

export interface Justification {
  id: string;
  user_id: string;
  date: string;
  category: string | null;
  reason: string;
  verdict: 'pending' | 'accepted' | 'rejected';
  ai_explanation: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  user_id: string;
  amount: number;
  client_name: string;
  date: string;
  created_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  length: number;
  active: boolean;
  created_at: string;
}

export type HabitField = 'water_ml' | 'steps' | 'workout_count' | 'stretching' | 'reinforcement' | 'pages' | 'study_minutes' | 'alcohol';
