'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { calculateMacros, DEFAULT_PROFILES, type UserProfile, type MacroTargets } from '@/lib/macros';

/** We store both targets + profile fields in macro_targets JSONB */
interface StoredData extends MacroTargets {
  profile?: UserProfile;
}

export function useProfile(userId: string) {
  const supabase = useMemo(() => createClient(), []);
  const defaultProfile = DEFAULT_PROFILES[userId] || DEFAULT_PROFILES.simon;
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [targets, setTargets] = useState<MacroTargets>(() => calculateMacros(defaultProfile));
  const [loaded, setLoaded] = useState(false);

  // Load profile from Supabase on mount
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('users')
        .select('macro_targets')
        .eq('id', userId)
        .single();

      if (data?.macro_targets) {
        const stored = data.macro_targets as StoredData;
        if (stored.profile) {
          setProfile(stored.profile);
          setTargets(calculateMacros(stored.profile));
        } else if (stored.calories) {
          // Legacy: only targets stored, no profile yet
          setTargets({ calories: stored.calories, protein: stored.protein, carbs: stored.carbs, fat: stored.fat });
        }
      }
      setLoaded(true);
    }
    load();
  }, [userId, supabase]);

  // Save profile + update Supabase macro_targets
  const saveProfile = useCallback(async (newProfile: UserProfile) => {
    setProfile(newProfile);
    const newTargets = calculateMacros(newProfile);
    setTargets(newTargets);

    const payload: StoredData = { ...newTargets, profile: newProfile };
    await supabase
      .from('users')
      .update({ macro_targets: payload })
      .eq('id', userId);
  }, [userId, supabase]);

  return { profile, targets, loaded, saveProfile };
}
