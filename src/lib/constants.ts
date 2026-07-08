export const CHALLENGE_DAYS = 75;
export const CHALLENGE_START_DATE = '2026-07-09'; // Day 1 = 9 July 2026 (fresh restart)

export const GOALS = {
  water_ml: { target: 3000, label: 'Eau', unit: 'ml', icon: '💧' },
  steps: { target: 10000, label: 'Pas', unit: 'pas', icon: '👟' },
  workout: { target: 7, label: 'Sport', unit: '/semaine', icon: '💪' },
  stretching: { target: 1, label: 'Flex', unit: '', icon: '🧘' },
  reinforcement: { target: 1, label: 'Musique', unit: '', icon: '🎵' },
  pages: { target: 15, label: 'Lecture', unit: 'pages', icon: '📖' },
} as const;

export const WATER_INCREMENTS = [250, 500, 1000] as const;
