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
  workout_types: string[];
  stretching: boolean;
  reinforcement: boolean;
  pages: number;
  note: string | null;
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

export type HabitField = 'water_ml' | 'steps' | 'workout_count' | 'workout_types' | 'stretching' | 'reinforcement' | 'pages' | 'note';
