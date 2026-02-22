# 🏆 75 JOURS — Challenge Simon & Emma

## Vue d'ensemble

**Durée :** 75 jours consécutifs
**Participants :** Simon & Emma
**Mode :** Compétition (streaks)
**Date de début :** Dès que l'app est prête
**Objectif :** Construire des habitudes durables en sport, santé, mental, scolaire et professionnel

---

## 1. Objectifs quotidiens

### 💧 Hydratation
- **4 litres d'eau par jour** (Simon & Emma)
- Trackable dans l'app en temps réel (progression au fil de la journée)

### 🥗 Alimentation — Régime High Protein / Déficit calorique
- **Tracking IA multimodal** : l'utilisateur peut logger ses repas par :
  - 📸 Photo du repas (l'IA analyse et estime les macros)
  - ✏️ Description texte (ex : "poulet grillé avec riz brun et brocolis")
  - 🎤 Message vocal (ex : "j'ai fait une recette protéinée avec du tofu, des œufs et des légumes")
- **Macros trackées** : Calories, Protéines, Glucides, Lipides
- **Règles alimentaires** :
  - Privilégier les sources de protéines (viande maigre, poisson, œufs, légumineuses, tofu)
  - Fruits et légumes à chaque repas
  - Limiter le sucre ajouté (pas de sucre excessif, juste ce qu'il faut)
  - Déficit calorique modéré (à définir selon les profils de chacun)
- **Objectifs macro personnalisés** : configurables dans l'app par chaque utilisateur (calories, protéines, glucides, lipides) — à affiner ensemble au setup initial selon poids, taille et niveau d'activité

### 🏋️ Sport — 7 entraînements par semaine + 10 000 pas/jour

**Règle :** 7 entraînements par semaine, pas de planning fixe ni de jour imposé.

**Types d'entraînement disponibles :**
- 🏊 Natation (Simon & Emma — Emma fait aussi de la nage synchronisée)
- 🏃 Course à pied (Simon & Emma)
- 🏋️ Salle / Musculation (Simon principalement)
- 🚴 Vélo (à intégrer quand la météo le permet — spinning en attendant)

**Notes :**
- Préparation triathlon (12 septembre) : les 3 disciplines doivent être couvertes
- Vélo : spinning/vélo stationnaire en hiver, extérieur au printemps
- 10 000 pas/jour en plus des entraînements

### 🧘 Étirements — Tous les jours
- Séance dédiée de **10-15 minutes** (séparée des entraînements)
- Cocher dans l'app quotidiennement

### 💪 Renforcement — Tous les jours
- Séance dédiée de **10-15 minutes** (séparée des entraînements)
- Exercices au poids du corps : gainage, pompes, squats, etc.
- Cocher dans l'app quotidiennement

### 📖 Lecture — 15 pages par jour
- Lecture personnelle uniquement (hors lectures scolaires)
- Logger le nombre de pages lues dans l'app

### 🍺 Alcool — Zéro sauf événements
- Pas d'alcool au quotidien
- Exception : événements importants uniquement (anniversaire, mariage, etc.)
- Si exception utilisée → le challenge est prolongé de 1 jour

### 📚 Révision active — 30 minutes par jour
- Simon : cours HEC
- Emma : cours Concordia
- Timer intégré dans l'app pour tracker les 30 minutes

### 💰 Objectif ventes (Simon uniquement)
- **30 000 $** de contrats signés chez VisualFlow Analytics
- Cumulatif sur les 75 jours
- Total mis à jour manuellement (progress bar)

---

## 2. Règles du Challenge

### Streak & Reset
- **Chaque jour complété à 100%** = streak +1
- **Si un objectif est manqué** = **reset à zéro** (jour 0)
- **Scoring :** basé sur les streaks (jours consécutifs sans manquer)

### Exception alcool
- Boire lors d'un événement légitime = **pas de reset**
- Mais le challenge est **prolongé de 1 jour** par occurrence

### Justification d'un entraînement manqué
- Si un workout est manqué, le participant peut **soumettre une justification**
- La justification est évaluée par un **arbitre IA intégré dans l'app**
- **Raisons acceptables** : surplus de travail exceptionnel, urgence familiale, maladie, obligation importante imprévue
- **Raisons refusées** : fatigue, flemme, oubli, "pas eu le temps" sans contexte exceptionnel
- Si la justification est **acceptée** → pas de reset
- Si la justification est **refusée** → reset à zéro

### Compétition
- Simon vs Emma — leaderboard basé sur le streak actuel
- Historique des streaks pour voir la progression
- Notifications/rappels pour maintenir la motivation

---

## 3. Cahier des charges — Web App

### 3.1 Stack technique suggérée
- **Frontend :** React / Next.js (PWA pour mobile)
- **Backend :** Next.js API routes ou Node.js
- **Base de données :** Supabase (PostgreSQL) ou Firebase
- **Auth :** Simple login (2 utilisateurs : Simon & Emma)
- **IA :** API Claude (Anthropic) pour :
  - Analyse des repas (photo/texte/vocal → macros)
  - Arbitre IA pour les justifications
- **Hébergement :** Vercel ou Railway

### 3.2 Pages / Fonctionnalités

#### Dashboard (page d'accueil)
- Vue du jour en cours avec tous les objectifs
- Streak actuel de chaque participant
- Leaderboard Simon vs Emma
- Jour X / 75 (+ jours ajoutés si exception alcool)
- Barre de progression journalière (X/Y objectifs complétés)

#### Tracker quotidien
- **Eau :** slider ou boutons (+250ml, +500ml, +1L) → objectif 4L
- **Sport :** cocher le workout du jour + type (natation, course, salle, vélo)
- **Pas :** saisie manuelle ou intégration (10 000 pas)
- **Étirements :** checkbox (fait / pas fait)
- **Renforcement :** checkbox (fait / pas fait)
- **Lecture :** nombre de pages lues (objectif 15)
- **Révision :** timer ou saisie manuelle (objectif 30 min)
- **Alcool :** toggle (sobre / événement) — si événement, +1 jour au challenge

#### Food Logger IA
- **Input multimodal :**
  - 📸 Prendre/uploader une photo → l'IA analyse le repas
  - ✏️ Décrire le repas en texte
  - 🎤 Enregistrer un vocal décrivant le repas (V1 — dès le lancement)
- **Output IA :**
  - Estimation des macros (calories, protéines, glucides, lipides)
  - Possibilité d'ajuster manuellement les estimations
- **Résumé journalier :**
  - Total calories / protéines / glucides / lipides
  - Progression vers les objectifs macro
  - Eau consommée

#### Justification & Arbitre IA
- Si un workout est manqué, bouton "Justifier"
- Saisie de la raison (texte)
- L'IA évalue et rend un verdict : ✅ Accepté / ❌ Refusé
- Historique des justifications

#### Ventes VisualFlow (Simon)
- Champ pour mettre à jour le total manuellement
- Progress bar vers 30 000 $
- Historique des mises à jour

#### Historique & Stats
- Calendrier visuel (jours complétés en vert, manqués en rouge)
- Graphiques de progression (streak, macros, eau, pages lues, etc.)
- Record de streak le plus long
- Comparaison Simon vs Emma

#### Profil / Settings
- Objectifs macro personnalisés (Simon vs Emma)
- Planning d'entraînement
- Notifications / rappels

---

## 4. Préparation Triathlon (12 septembre)

Objectif à intégrer dans la vision long terme au-delà des 75 jours :
- **Natation :** déjà intégrée dans le planning
- **Course :** déjà intégrée dans le planning
- **Vélo :** à intégrer quand la météo le permet (spinning en attendant)
- L'app pourrait avoir une section dédiée triathlon pour tracker les distances/temps

---

## 5. Design de l'application

### 5.1 Principes de design
- **Simple et fonctionnel** — pas de fioritures, UX directe
- **Mobile-first** — PWA, max-width 420px centré
- **Dark theme** — fond sombre (#0A0A0F), cards (#12121A)
- **Accent orange** (#FF6B35) pour les actions et highlights
- **Couleurs sémantiques** : vert (#00E676) = complété, rouge (#FF3D57) = manqué, bleu (#448AFF) = info, jaune (#FFD740) = lipides/lecture

### 5.2 Typographie
- **Titres / Display :** Dela Gothic One (bold, impactant)
- **Body :** DM Sans (lisible, moderne)
- **Données / Chiffres :** JetBrains Mono (monospace, précis)

### 5.3 Navigation
- Barre de navigation fixe en bas (5 onglets) :
  - 🏠 Home (Dashboard)
  - 🍽️ Food (Food Logger IA)
  - ⚖️ Justifier (Arbitre IA)
  - 💰 Ventes (Simon uniquement)
  - 📊 Stats (Historique & Comparaison)
- Indicateur actif : trait orange au-dessus de l'icône + couleur accent
- Background nav : card color avec backdrop-blur

### 5.4 Pages détaillées

#### PAGE 1 : Dashboard (🏠 Home)

**En-tête :**
- Jour X / 75 (compteur avec label uppercase)
- Titre "75 JOURS" en display font
- Toggle Simon / Emma (boutons côte à côte, border accent quand actif)

**Streak Battle :**
- Card avec gradient subtil
- Simon VS Emma côte à côte
- Streak actuel en gros chiffre (display font)
- 👑 "En tête" sous le leader
- Emoji feu en filigrane (opacity 0.04)

**Progression journalière :**
- Ring circulaire (SVG) avec pourcentage
- "X/Y objectifs complétés aujourd'hui"

**Liste des habitudes :**
- Une row par habitude avec :
  - Icône emoji à gauche
  - Label + valeur actuelle/cible (si applicable)
  - Barre de progression mini (si target chiffré)
  - Checkbox à droite (carré arrondi, vert quand coché)
- Habitudes :
  - 💧 Eau (progress bar, X/4L)
  - 🏋️ Workout (progress bar, X/7 par semaine)
  - 👣 Pas (progress bar, X/10000)
  - 🧘 Étirements (checkbox simple)
  - 💪 Renforcement (checkbox simple)
  - 📖 Lecture (progress bar, X/15 pages)
  - 📚 Révision (progress bar, X/30 min)
  - 🍺 Pas d'alcool (checkbox simple)

#### PAGE 2 : Food Logger IA (🍽️ Food)

**Résumé macros :**
- Grid 2x2 avec 4 cards :
  - Calories (orange) : valeur / cible + % + progress bar
  - Protéines (vert) : valeur / cible + % + progress bar
  - Glucides (bleu) : valeur / cible + % + progress bar
  - Lipides (jaune) : valeur / cible + % + progress bar

**Ajouter un repas :**
- 3 modes d'input (boutons toggle) :
  - 📸 Photo : zone drag & drop / capture camera
  - ✏️ Texte : champ texte libre avec placeholder
  - 🎤 Vocal : bouton micro rond avec glow effect
- Bouton "Analyser avec l'IA ✨" (gradient orange, full width)
- L'IA retourne : estimation macros avec possibilité d'ajuster manuellement

**Repas du jour :**
- Liste chronologique des repas loggés
- Chaque repas : nom, heure, description, calories, macros (P/G/L)

#### PAGE 3 : Justifier (⚖️ Justifier)

**Formulaire de justification :**
- Explication du fonctionnement
- Textarea pour la raison
- Bouton "Soumettre à l'arbitre IA ⚖️"

**Arbitre IA :**
- L'IA évalue la justification et rend un verdict
- Raisons acceptables : urgence médicale, obligation familiale importante, surplus de travail exceptionnel
- Raisons refusées : fatigue, flemme, oubli, "pas le temps" sans contexte exceptionnel

**Historique :**
- Liste des justifications passées
- Chaque entrée : date, raison citée, verdict (✅ Accepté / ❌ Refusé), explication de l'IA
- Style : bordure verte ou rouge selon verdict, réponse IA en italic avec barre latérale colorée

#### PAGE 4 : Ventes (💰 Ventes) — Simon uniquement

**Progress bar principale :**
- Card avec gradient vert subtil
- Montant actuel en gros (display font, vert)
- "/ 30 000 $ objectif"
- Barre de progression large avec glow
- Pourcentage atteint

**Ajouter une vente :**
- Bouton pour ajouter manuellement (montant + nom du client)

**Historique :**
- Liste des ventes : date, client, montant (vert, +X $)

#### PAGE 5 : Stats (📊 Stats)

**Résumé rapide :**
- 2 stat cards côte à côte :
  - 🔥 Meilleur streak (record)
  - ✅ Taux de réussite (%)

**Calendrier visuel :**
- Grille 7 colonnes (L-M-M-J-V-S-D)
- Chaque jour : carré coloré
  - Vert = jour complété
  - Rouge = jour manqué
  - Gris = à venir
- Légende en dessous

**Comparaison Simon vs Emma :**
- Tableau avec métriques de la semaine
- Chaque ligne : valeur Simon | label | valeur Emma
- Valeur gagnante en accent orange + bold
- Métriques : eau moy., protéines moy., workouts, pages lues

---

## 6. Spécifications techniques pour Claude Code

### 6.1 Stack recommandée
- **Framework :** Next.js (React) — PWA mobile-first
- **Styling :** CSS-in-JS ou Tailwind (dark theme)
- **Base de données :** Supabase (PostgreSQL) — auth simple 2 users
- **IA :** API Claude (Anthropic) pour :
  - Food logger : analyse photo/texte/vocal → estimation macros
  - Arbitre : évaluation des justifications → verdict
- **Vocal :** Web Speech API (speech-to-text) → texte envoyé à Claude
- **Photo :** Input camera/upload → image envoyée à Claude Vision
- **Hébergement :** Vercel

### 6.2 Modèle de données

```
User {
  id, name, email, macro_targets (cal, prot, gluc, lip), created_at
}

DailyLog {
  id, user_id, date,
  water_ml, steps, workout_done, workout_type,
  stretching_done, reinforcement_done,
  pages_read, study_minutes,
  alcohol (none | event),
  completed (bool), streak_day
}

Meal {
  id, user_id, date, time, name, description,
  input_type (photo | text | vocal),
  calories, protein, carbs, fat,
  ai_raw_response, manually_adjusted (bool)
}

Justification {
  id, user_id, date, reason,
  verdict (accepted | rejected),
  ai_explanation
}

Sale {
  id, user_id, date, amount, client_name
}

Streak {
  id, user_id, start_date, end_date, length, active (bool)
}
```

### 6.3 Logique métier clé
- **Streak :** incrémente chaque jour si DailyLog.completed = true. Reset à 0 si manqué ET justification refusée.
- **Alcool événement :** si alcohol = "event", le total de jours du challenge passe de 75 à 75 + nombre d'événements.
- **Workout hebdo :** compteur qui reset chaque lundi, objectif = 7/semaine.
- **Food logger IA :** envoyer photo/texte/transcription vocale à l'API Claude, parser la réponse JSON avec les macros estimées, permettre l'ajustement manuel.
- **Arbitre IA :** prompt système strict avec les règles d'acceptation/refus, retourne verdict + explication.

---

## 7. Prochaines étapes

1. ✅ **Étape 1 :** Détailler les objectifs
2. ✅ **Étape 2 :** Designer l'app (maquettes validées)
3. ⬜ **Étape 3 :** Développer avec Claude Code (utiliser ce document comme brief)
4. ⬜ **Étape 4 :** Tester et lancer le challenge !
