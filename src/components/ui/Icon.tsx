'use client';

/**
 * Jeu d'icônes au trait (style Lucide) — remplace les emojis.
 * Couleur via `currentColor`, taille via `size`, épaisseur via `stroke`.
 */

export type IconName =
  | 'droplet' | 'footprints' | 'dumbbell' | 'sparkle' | 'activity' | 'music'
  | 'flame' | 'book' | 'moon'
  | 'pencil' | 'camera' | 'mic' | 'barcode' | 'settings'
  | 'check' | 'plus' | 'x' | 'arrow-left' | 'chevron-down'
  | 'trophy' | 'crown' | 'sun' | 'refresh' | 'star';

const PATHS: Record<IconName, string> = {
  droplet: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
  footprints:
    'M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z ' +
    'M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z ' +
    'M16 17h4 M4 13h4',
  dumbbell: 'M6.5 12h11 M4 9v6 M7 7.5v9 M17 7.5v9 M20 9v6',
  sparkle:
    'M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  music: 'M9 18V5l12-2v13',
  flame:
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z',
  pencil: 'M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z',
  camera: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z',
  mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3',
  barcode: 'M3 5v14 M7 5v14 M11 5v14 M16 5v14 M20 5v14',
  settings:
    'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
  check: 'M20 6 9 17l-5-5',
  plus: 'M5 12h14 M12 5v14',
  x: 'M18 6 6 18 M6 6l12 12',
  'arrow-left': 'm12 19-7-7 7-7 M19 12H5',
  'chevron-down': 'm6 9 6 6 6-6',
  trophy:
    'M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 0 0 12 0V2Z',
  crown: 'M11.56 3.27a.5.5 0 0 1 .88 0l2.95 5.6a1 1 0 0 0 1.52.3l4.27-3.67a.5.5 0 0 1 .8.52l-2.84 10.25a1 1 0 0 1-.95.73H5.81a1 1 0 0 1-.96-.73L2.02 6.02a.5.5 0 0 1 .8-.52l4.27 3.67a1 1 0 0 0 1.52-.3z M5 21h14',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  refresh: 'M3 12a9 9 0 0 1 15-6.7L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-15 6.7L3 16 M3 21v-5h5',
  star: 'M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.8l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94z',
};

// Icônes qui contiennent des cercles (dessinés en plus du path).
const CIRCLES: Partial<Record<IconName, [number, number, number][]>> = {
  camera: [[12, 13, 3]],
  music: [[6, 18, 3], [18, 16, 3]],
  settings: [[12, 12, 3]],
};

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
  fill?: boolean;
}

export function Icon({ name, size = 20, stroke = 1.8, className = '', fill = false }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      {PATHS[name].split(' M').map((seg, i) => (
        <path key={i} d={i === 0 ? seg : 'M' + seg} />
      ))}
      {CIRCLES[name]?.map(([cx, cy, r], i) => (
        <circle key={`c${i}`} cx={cx} cy={cy} r={r} fill="none" />
      ))}
    </svg>
  );
}

/** Avatar monogramme — remplace les emojis 🦁/🦊 pour les noms. */
export function Monogram({ name, size = 40, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-accent/[0.12] text-accent shadow-[inset_0_0_0_0.5px_var(--accent-ring)] ${className}`}
      style={{ width: size, height: size }}
    >
      <span
        className="font-[family-name:var(--font-playfair)] font-semibold leading-none"
        style={{ fontSize: size * 0.44 }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
