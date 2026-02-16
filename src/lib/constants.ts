export const CHALLENGE_DAYS = 75;
export const CHALLENGE_START_DATE = '2026-02-16'; // Day 1 = 16 Feb 2026

export const USERS = {
  simon: {
    id: 'simon',
    name: 'Simon',
    emoji: '🦁',
  },
  emma: {
    id: 'emma',
    name: 'Emma',
    emoji: '🦊',
  },
} as const;

export const GOALS = {
  water_ml: { target: 4000, label: 'Eau', unit: 'ml', icon: '💧' },
  steps: { target: 10000, label: 'Pas', unit: 'pas', icon: '👟' },
  workout: { target: 7, label: 'Workout', unit: '/semaine', icon: '💪' },
  stretching: { target: 1, label: 'Stretching', unit: '', icon: '🧘' },
  reinforcement: { target: 1, label: 'Renforcement', unit: '', icon: '🏋️' },
  pages: { target: 15, label: 'Lecture', unit: 'pages', icon: '📖' },
  study_minutes: { target: 30, label: 'Étude', unit: 'min', icon: '📚' },
  alcohol: { target: 0, label: 'Alcool', unit: '', icon: '🚫' },
} as const;

export const MACRO_TARGETS = {
  simon: { calories: 2500, protein: 180, carbs: 280, fat: 80 },
  emma: { calories: 1800, protein: 130, carbs: 200, fat: 60 },
} as const;

export const WATER_INCREMENTS = [250, 500, 1000] as const;

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Accueil', icon: 'home' },
  { href: '/food', label: 'Repas', icon: 'utensils' },
  { href: '/justifier', label: 'Justifier', icon: 'scale' },
  { href: '/ventes', label: 'Ventes', icon: 'dollar', simonOnly: true },
  { href: '/stats', label: 'Stats', icon: 'chart' },
] as const;
