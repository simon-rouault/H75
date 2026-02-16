import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '75 Jours Challenge',
    short_name: '75 Jours',
    description: 'Challenge 75 jours — Simon & Emma',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0A0A0F',
    theme_color: '#FF6B35',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
