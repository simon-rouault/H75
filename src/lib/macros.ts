export interface UserProfile {
  sex: 'male' | 'female';
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'lean_bulk' | 'gain';
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const ACTIVITY_MULTIPLIERS: Record<UserProfile['activity_level'], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_OFFSETS: Record<UserProfile['goal'], number> = {
  lose: -400,
  maintain: 0,
  lean_bulk: 200,
  gain: 400,
};

/** Mifflin-St Jeor + activity + goal → macro targets */
export function calculateMacros(profile: UserProfile): MacroTargets {
  // BMR (Mifflin-St Jeor)
  const bmr =
    profile.sex === 'male'
      ? 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5
      : 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 161;

  const tdee = bmr * ACTIVITY_MULTIPLIERS[profile.activity_level];
  const calories = Math.round(tdee + GOAL_OFFSETS[profile.goal]);

  // Protein per kg: lose 2.2 (preserve muscle), lean_bulk 2.2 (max muscle), gain 2.0, maintain 1.8
  const proteinPerKg = profile.goal === 'lose' || profile.goal === 'lean_bulk' ? 2.2 : profile.goal === 'gain' ? 2.0 : 1.8;
  const protein = Math.round(profile.weight_kg * proteinPerKg);

  // Fat: 25% of calories
  const fat = Math.round((calories * 0.25) / 9);

  // Carbs: remaining calories
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

  return { calories, protein, carbs: Math.max(carbs, 50), fat };
}

export const DEFAULT_PROFILES: Record<string, UserProfile> = {
  simon: { sex: 'male', age: 25, height_cm: 180, weight_kg: 80, activity_level: 'active', goal: 'maintain' },
  emma: { sex: 'female', age: 25, height_cm: 165, weight_kg: 58, activity_level: 'moderate', goal: 'maintain' },
};

export const ACTIVITY_LABELS: Record<UserProfile['activity_level'], string> = {
  sedentary: 'Sédentaire',
  light: 'Légèrement actif',
  moderate: 'Modérément actif',
  active: 'Actif',
  very_active: 'Très actif',
};

export const GOAL_LABELS: Record<UserProfile['goal'], string> = {
  lose: 'Perte de poids',
  maintain: 'Maintien',
  lean_bulk: 'Muscle sec',
  gain: 'Prise de masse',
};
