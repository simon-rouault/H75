import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'H75',
    short_name: 'H75',
    description: "H75 — challenge d'habitudes de Simon & Emma",
    start_url: '/login',
    display: 'standalone',
    background_color: '#0B0A10',
    theme_color: '#0B0A10',
    orientation: 'portrait',
    icons: [
      {
        src: '/h75-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/h75-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/h75-touch.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
