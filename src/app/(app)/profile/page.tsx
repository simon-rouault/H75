'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useProfile } from '@/hooks/useProfile';
import { PageHeader } from '@/components/layout/PageHeader';
import { calculateMacros, ACTIVITY_LABELS, GOAL_LABELS, type UserProfile } from '@/lib/macros';

function NotificationSettings() {
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState('20:00');
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission);
    const stored = localStorage.getItem('75j-notif');
    if (stored) {
      const { enabled: e, time: t } = JSON.parse(stored) as { enabled: boolean; time: string };
      setEnabled(e);
      if (t) setTime(t);
    }
  }, []);

  async function toggle() {
    if (!enabled) {
      // Request permission
      if ('Notification' in window && Notification.permission !== 'granted') {
        const p = await Notification.requestPermission();
        setPermission(p);
        if (p !== 'granted') return;
      }
    }
    const next = !enabled;
    setEnabled(next);
    const data = { enabled: next, time };
    localStorage.setItem('75j-notif', JSON.stringify(data));
    // Notify SW
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SCHEDULE_REMINDER', ...data });
    }
  }

  function saveTime(newTime: string) {
    setTime(newTime);
    const data = { enabled, time: newTime };
    localStorage.setItem('75j-notif', JSON.stringify(data));
    if (enabled && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SCHEDULE_REMINDER', ...data });
    }
  }

  if (!('Notification' in window)) return null;

  return (
    <div className="bg-card rounded-2xl border border-[var(--border)] p-5">
      <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.1em] mb-4">Rappel quotidien</label>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[14px] font-medium">Notification de rappel</div>
          <div className="text-[12px] text-muted mt-0.5">
            {permission === 'denied' ? '🚫 Bloqué — Active les notifs dans Safari' : enabled ? 'Activé' : 'Désactivé'}
          </div>
        </div>
        <button onClick={toggle} disabled={permission === 'denied'}
          className={`relative w-12 h-7 rounded-full transition-all duration-200 ${enabled && permission === 'granted' ? 'bg-green' : 'bg-foreground/[0.10]'}`}>
          <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-200 ${enabled && permission === 'granted' ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>
      {enabled && permission === 'granted' && (
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-muted">Heure du rappel</span>
          <input type="time" value={time} onChange={e => saveTime(e.target.value)}
            className="h-10 px-3 rounded-xl bg-foreground/[0.05] border border-[var(--border)] text-[14px] outline-none focus:border-accent/30 transition-all" />
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { userId } = useUser();
  const { profile, loaded, saveProfile } = useProfile(userId);
  const router = useRouter();
  const [editProfile, setEditProfile] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);

  // Once the saved profile is loaded from Supabase, populate the form with it so
  // previously entered values show up after reopening the app or on another device.
  useEffect(() => {
    if (loaded) setEditProfile(profile);
  }, [loaded, profile]);

  function handleSave() {
    saveProfile(editProfile);
    setSaved(true);
    setTimeout(() => router.back(), 400);
  }

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-3">
        <div className="w-7 h-7 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
        <span className="text-[13px] text-muted">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Mon profil" subtitle="Paramètres nutritionnels" />

      <div className="space-y-5">
        {/* Sex */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.1em] mb-3">Sexe</label>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setEditProfile({ ...editProfile, sex: s })}
                className={`flex-1 py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 ${
                  editProfile.sex === s
                    ? 'bg-accent text-white shadow-[0_2px_12px_-4px_var(--glow-strong)]'
                    : 'bg-foreground/[0.04] text-muted/60 hover:text-foreground border border-border/60'
                }`}
              >
                {s === 'male' ? 'Homme' : 'Femme'}
              </button>
            ))}
          </div>
        </div>

        {/* Age / Height / Weight */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.1em] mb-3">Mensurations</label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'age', label: 'Âge', unit: 'ans', min: 14, max: 80 },
              { key: 'height_cm', label: 'Taille', unit: 'cm', min: 120, max: 220 },
              { key: 'weight_kg', label: 'Poids', unit: 'kg', min: 30, max: 200 },
            ] as const).map((field) => (
              <div key={field.key}>
                <label className="block text-[10px] font-semibold text-muted uppercase tracking-[0.1em] mb-1.5">{field.label}</label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={field.min}
                    max={field.max}
                    value={editProfile[field.key]}
                    onChange={(e) => setEditProfile({ ...editProfile, [field.key]: Number(e.target.value) })}
                    className="w-full bg-foreground/[0.04] border border-border/60 rounded-xl px-3 py-3 text-foreground text-center font-[family-name:var(--font-jetbrains-mono)] text-[16px] font-bold focus:outline-none focus:border-accent/40 transition-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted/30 font-medium">{field.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity level */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.1em] mb-3">Activité</label>
          <div className="space-y-1.5">
            {(Object.entries(ACTIVITY_LABELS) as [UserProfile['activity_level'], string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setEditProfile({ ...editProfile, activity_level: key })}
                className={`w-full text-left px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 ${
                  editProfile.activity_level === key
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'bg-foreground/[0.03] text-muted/60 border border-transparent hover:text-foreground hover:bg-foreground/[0.05]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.1em] mb-3">Objectif</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(GOAL_LABELS) as [UserProfile['goal'], string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setEditProfile({ ...editProfile, goal: key })}
                className={`py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                  editProfile.goal === key
                    ? 'bg-accent text-white shadow-[0_2px_12px_-4px_var(--glow-strong)]'
                    : 'bg-foreground/[0.04] text-muted/60 hover:text-foreground border border-border/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Calculated preview */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="text-[10px] font-bold text-muted/40 uppercase tracking-[0.12em] mb-3">Objectifs calculés</div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Cal', value: calculateMacros(editProfile).calories, color: 'text-accent' },
              { label: 'Prot', value: calculateMacros(editProfile).protein, color: 'text-blue' },
              { label: 'Gluc', value: calculateMacros(editProfile).carbs, color: 'text-yellow' },
              { label: 'Lip', value: calculateMacros(editProfile).fat, color: 'text-red' },
            ].map((m) => (
              <div key={m.label}>
                <div className={`font-[family-name:var(--font-jetbrains-mono)] text-[18px] font-bold ${m.color}`}>{m.value}</div>
                <div className="text-[10px] text-muted/40 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <NotificationSettings />

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`w-full py-4 rounded-xl font-semibold text-[15px] transition-all duration-200 active:scale-[0.97] shadow-[0_2px_16px_-4px_var(--glow-strong)] ${
            saved
              ? 'bg-green text-white'
              : 'bg-gradient-to-r from-accent to-accent-hover text-white'
          }`}
        >
          {saved ? '✓ Enregistré' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
