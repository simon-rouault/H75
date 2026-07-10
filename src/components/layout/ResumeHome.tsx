'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Quand l'app est rouverte après ce délai en arrière-plan, on revient à l'accueil
// (l'écran de choix de la personne).
const RESET_AFTER_MS = 90_000; // 90 s

/** Ramène sur l'écran d'accueil (choix Simon/Emma) à chaque réouverture de l'app. */
export function ResumeHome() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const hiddenAtRef = useRef(0);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const away = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
        if (away > RESET_AFTER_MS && pathnameRef.current !== '/login') {
          router.replace('/login');
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [router]);

  return null;
}
