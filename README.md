# 75 Jours

PWA de challenge d'habitudes pour deux personnes (Simon & Emma). L'objectif :
enchaîner **75 jours d'affilée** en validant chaque jour ses objectifs. Un jour
manqué remet le streak à zéro ; une fois les 75 jours atteints, le défi continue
pour ancrer l'habitude.

## Objectifs quotidiens (6)

| Objectif        | Cible                    |
| --------------- | ------------------------ |
| 💧 Eau          | 3 L                      |
| 👟 Pas          | 10 000                   |
| 💪 Sport        | 1 séance (ou jour de repos) |
| 🧘 Objectif perso | Flex **ou** Musique    |
| 📖 Lecture      | 15 pages                 |
| 🍽 Calories     | selon l'objectif du profil |

Le jour bascule à **minuit local** de chaque personne (Paris pour Simon, Mexique
pour Emma, etc.).

## Pages

- **Objectifs** (`/dashboard`) — saisie des objectifs du jour, progression, streak
- **Repas** (`/food`) — suivi nutritionnel (texte / photo / voix / code-barre via IA), réglages du profil (⚙)
- **Stats** (`/stats`) — cumuls, calendrier, comparaison avec le rival

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4**
- **Supabase** (Postgres) — accès direct côté client via la clé anon
- **Gemini** — analyse nutritionnelle des repas
- Hébergement **Vercel** (déploiement auto au push sur `main`)

## Structure

```
src/
  app/
    (app)/        pages authentifiées : dashboard, food, stats, profile + layout
    api/          routes serveur : barcode, food-analyze, login, weight
    login/        écran de connexion
  components/
    layout/       Sidebar (desktop), BottomNav (mobile), PageHeader
    ui/           Button, ProgressBar, ProgressRing
  hooks/          useUser, useDailyLog, useMeals, useProfile, useVoiceInput
  lib/            constants, dates, macros, streak-engine, supabase/
  types/          database.ts
supabase/migrations/   schéma SQL + scripts de maintenance
```

## Développement

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
npm run lint
```

## Variables d'environnement (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
```

## Déploiement

Push sur `main` → Vercel build et met en ligne automatiquement (mobile + desktop,
même PWA responsive).
