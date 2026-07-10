# 🎨 DESIGN — 75 Jours

Référence unique de la direction artistique. On modifie ce doc **et** le code
ensemble : ce fichier décrit l'intention, [globals.css](src/app/globals.css) et
[layout.tsx](src/app/layout.tsx) l'appliquent.

> **Où changer quoi**
> - Couleurs, thèmes, animations, classes utilitaires → `src/app/globals.css`
> - Polices → `src/app/layout.tsx`
> - Tailles / espacements / rayons d'un écran → classes Tailwind inline dans le `.tsx`
> - Icônes & couleur PWA → `src/app/manifest.ts` + `public/`

---

## 1. Principes

- **Inspiration Apple / iOS** : noir profond, surfaces surélevées, hairlines fines, coins très arrondis.
- **Sombre par défaut**, thème clair disponible (bascule ☀️/🌙, mémorisée dans `localStorage`).
- **Mobile-first** : conçu pour le téléphone (PWA), élargi proprement sur desktop.
- **Une seule couleur de marque** (orange) qui guide l'œil ; le reste est neutre + sémantique.
- Sobriété : beaucoup de gris/muted, l'accent et les dégradés sont des récompenses visuelles (streak, réussite).

---

## 2. Couleurs (tokens)

Définies en variables CSS dans `globals.css` — `:root` (sombre) et `:root.light` (clair).
Utilisées via Tailwind : `bg-card`, `text-accent`, `bg-green`, `text-muted`…

### Marque
| Token | Sombre | Clair | Usage |
| --- | --- | --- | --- |
| `--accent` | `#FF6B2C` | `#E8571F` | Couleur principale (boutons, actifs, dégradés) |
| `--accent-hover` | `#FF7D42` | `#D14A15` | Survol |
| `--accent-soft` | orange 10% | orange 7% | Fonds teintés discrets |

### Sémantique
| Token | Sombre | Sens |
| --- | --- | --- |
| `--green` | `#30D158` | Réussi / objectif atteint |
| `--red` | `#FF453A` | Manqué / dépassement |
| `--blue` | `#0A84FF` | Info / secondaire |
| `--yellow` | `#FFD60A` | Lecture / glucides |
| `--orange` | `#FF9F0A` | Jour en cours (calendrier) |

### Surfaces & texte
| Token | Sombre | Rôle |
| --- | --- | --- |
| `--background` | `#000000` | Fond de page |
| `--card` | `#1C1C1E` | Cartes / surfaces |
| `--foreground` | `#F5F5F7` | Texte principal |
| `--muted` | `#636366` | Texte secondaire / labels |
| `--border` | blanc 7% | Hairline des cartes |
| `--separator` | blanc 6% | Séparateurs internes |
| `--glow` / `--glow-strong` | orange 12% / 30% | Halos autour de l'accent |

---

## 3. Typographie

Trois polices Google (chargées dans `layout.tsx`) :

| Police | Variable | Rôle | Exemple |
| --- | --- | --- | --- |
| **Dela Gothic One** | `--font-dela-gothic` | Gros titres d'affichage | « JOUR 1 », titres de page |
| **JetBrains Mono** | `--font-jetbrains-mono` | Chiffres / données | streaks, %, calories, poids |
| **DM Sans** | `--font-dm-sans` | Texte courant (défaut du `body`) | labels, boutons, paragraphes |

- Interlettrage global légèrement serré (`letter-spacing: -0.015em`).
- **Règle** : tout nombre « qui compte » (streak, kcal, pas, %) est en **mono**.

### Échelle de texte (px, conventions observées)
`10–11` labels/légendes · `12–13` texte courant secondaire · `14–15` corps/boutons ·
`18–22` valeurs mises en avant · `28–34` titres de section · `96` chiffre héros (JOUR).
Labels en capitales avec `tracking` large (`0.12`–`0.28em`).

---

## 4. Rayons (border-radius)

| Classe | ~valeur | Usage |
| --- | --- | --- |
| `rounded-3xl` | 24px | **Cartes** principales |
| `rounded-2xl` | 16px | Badges, contrôles segmentés, sous-cartes |
| `rounded-xl` | 12px | **Boutons, inputs** (le plus courant) |
| `rounded-lg` | 8px | Petits éléments, icônes |
| `rounded-full` | ∞ | Pastilles, points, avatars, pills de statut |
| `rounded-[3px]`/`[5px]` | 3–5px | Cases du calendrier |

---

## 5. Bordures & ombres

Deux signatures visuelles à respecter partout :

- **Hairline de carte** (bordure 0.5px au lieu d'un `border`) :
  `shadow-[inset_0_0_0_0.5px_var(--border)]` — c'est LA bordure des cartes.
  Variante interne plus douce : `…var(--separator)`.
- **Halo d'accent** sur les éléments actifs/CTA :
  `shadow-[0_2px_16px_-4px_var(--glow-strong)]`.
- **États actifs colorés** = hairline teintée : ex. sélection verte
  `shadow-[inset_0_0_0_0.5px_rgba(48,209,88,0.25)]`, accent orange, etc.

> Pas de bordures « pleines » 1px classiques : on utilise l'inset 0.5px pour la finesse iOS.

---

## 6. Layout & espacement

- Largeur de contenu : **420px** max sur mobile, **780px** sur desktop (`layout.tsx`).
- Desktop : **Sidebar** fixe 220px à gauche ; mobile : **BottomNav** collée en bas (safe-area gérée).
- Rythme vertical entre blocs : `space-y-3` (dashboard) / sections avec petits labels capitales.
- Cartes : padding `p-5` typiquement.

---

## 7. Animations

Toutes définies dans `globals.css` (keyframes) + classes utilitaires `.animate-*`.

| Classe | Effet | Usage |
| --- | --- | --- |
| `.animate-fade-up` | fondu + montée | entrée des blocs (avec `.delay-1…8` en cascade) |
| `.animate-fade-in` | fondu simple | overlays |
| `.animate-bounce-in` | pop rebond | emojis de célébration, badges |
| `.animate-spring-pop` | pop ressort | résultats (repas, etc.) |
| `.animate-slide-down` | glisse vers le bas | contenus dépliés |
| `.animate-breathe` | pulsation | enregistrement vocal |
| `confetti-fall` | chute confettis | overlay « Défi réussi » |
| `.animate-spin` | rotation | spinners de chargement |

Courbe standard : `cubic-bezier(0.16, 1, 0.3, 1)` (sortie douce), et
`cubic-bezier(0.34, 1.56, 0.64, 1)` pour les effets « rebond ».

---

## 8. Effets signature

- **`.gradient-text`** : dégradé orange→ambre animé, réservé aux chiffres/titres forts
  (streak, %, « JOUR », « Défi réussi »). À ne pas sur-utiliser.
- **`.glass`** : fond translucide + `backdrop-blur` (barres de nav, overlays).

---

## 9. Motifs de composants

- **Carte** : `bg-card rounded-3xl shadow-[inset_0_0_0_0.5px_var(--border)] p-5`.
- **Groupe d'habitudes** : cartes empilées, lignes séparées par `divide-y divide-[var(--separator)]`, chaque ligne dépliable.
- **Bouton** ([ui/Button](src/components/ui/Button.tsx)) : `rounded-xl`, variantes `primary` (accent) / `secondary` / `ghost` / `danger`, tailles `sm/md`.
- **Contrôle segmenté** : piste `bg-foreground/[0.05] rounded-2xl`, curseur accent qui glisse.
- **ProgressRing / ProgressBar** : anneau pour la complétion du jour et les calories, barres pour chaque objectif ; passent au **vert** quand l'objectif est atteint.
- **Overlays plein écran** : fond noir + `backdrop-blur`, contenu centré, `z-50` (succès `z-60`).

---

## 10. Règles pour rester cohérent

1. Une seule couleur d'accent — pas d'ajout de teintes hors palette.
2. Chiffres = mono ; titres forts = Dela Gothic ; reste = DM Sans.
3. Bordures = hairline inset 0.5px, jamais de border pleine.
4. Vert = réussite, rouge = échec, orange = en cours — ne pas détourner ces sens.
5. Toujours gérer **les deux thèmes** (sombre + clair) en modifiant un token.
6. `.gradient-text` et les halos = récompenses ponctuelles, pas décor permanent.

---

## 11. À décider ensemble (journal des changements)

_On note ici ce qu'on veut faire évoluer :_
- [ ] …
