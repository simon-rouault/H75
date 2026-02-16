'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Accueil', icon: HomeIcon },
  { href: '/food', label: 'Repas', icon: FoodIcon },
  { href: '/justifier', label: 'Justifier', icon: ScaleIcon },
  { href: '/ventes', label: 'Ventes', icon: DollarIcon, simonOnly: true },
  { href: '/stats', label: 'Stats', icon: ChartIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const { userId, isSimon } = useUser();
  const [pendingCount, setPendingCount] = useState(0);
  const otherUserId = userId === 'simon' ? 'emma' : 'simon';
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchPending() {
      const { count } = await supabase
        .from('justifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', otherUserId)
        .eq('verdict', 'pending');
      setPendingCount(count || 0);
    }
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [otherUserId, supabase]);

  const items = NAV_ITEMS.filter((item) => !item.simonOnly || isSimon);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      {/* Top gradient line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <div className="glass">
        <div className="max-w-[420px] lg:max-w-[800px] mx-auto flex justify-around py-2 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          {items.map((item) => {
            const active = pathname === item.href;
            const showBadge = item.href === '/justifier' && pendingCount > 0;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 ${
                  active ? 'text-accent' : 'text-muted/50 hover:text-foreground'
                }`}
              >
                <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-accent/10' : ''}`}>
                  <Icon active={active} />
                </div>
                <span className={`text-[10px] font-semibold ${active ? 'text-accent' : ''}`}>{item.label}</span>
                {showBadge && (
                  <span className="absolute top-0 right-0.5 bg-red text-white text-[8px] font-bold w-[16px] h-[16px] rounded-full flex items-center justify-center shadow-[0_0_12px_-1px_var(--red)]">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
    </svg>
  );
}

function FoodIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
    </svg>
  );
}

function ScaleIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M3 7l3 5h6l3-5M3 12h6M15 12h6M21 7l-3 5h-6" />
    </svg>
  );
}

function DollarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}
